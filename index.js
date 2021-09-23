// @ts-check

const fs = require('fs');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const {Client, Collection, Intents} = require('discord.js');
const mongoose = require('mongoose');

const {token, mongo_URI, client_id} = require('./utils/config');

const rest = new REST({version: '9'}).setToken(token);

/**
 * @typedef GuildData
 * @type {{triviaData: {isTriviaRunning: boolean}, queueHistory: Track[]}}
 */

/**
 * @typedef PlayTrack
 * @type {{url: string, title: string, rawDuration: string, duration: string, timestamp: String, thumbnail: string, voiceChannel: *, memberDisplayName: string, memberAvatar: string}}
 */

/**
 * @typedef Artist
 * @type {{name: string}}
 */

/**
 * @typedef Track
 * @type {{name: string, url: string, artists: string[], preview_url: string}}
 */

/**
 * @typedef CustomAudioPlayer
 * @type {{audioPlayer: import('@discordjs/voice').AudioPlayer, loopTimes: number, nowPlaying?: {title: string}, connection: import('@discordjs/voice').VoiceConnection, loopSong: boolean, loopQueue: boolean, queue: Track[], commandLock: boolean, length: number, queueHistory: Track[]}}
 */

/**
 * @typedef Command
 * @type {{data: {name: string, toJSON: () => string}, execute: (interaction: CustomInteraction) => Promise<void>}}
 */

/**
 * @typedef CustomClient
 * @type {Client & {playerManager: Map<string, CustomAudioPlayer>; commands: Collection<string, Command>, guildData: Map<string, GuildData>, triviaManager: Map<string, import('./utils/music/TriviaPlayer.js')>}}
 */

/**
 * @typedef CustomInteraction
 * @type {Omit<import('discord.js').CommandInteraction, 'deferReply'> & {client: CustomClient, guild: {client: CustomClient}, member: import('discord.js').GuildMember, deferReply: (x?: {fetchReply: boolean}) => Promise<import('discord.js').Message>}}
 */

/**
 * @type {CustomClient}
 */
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

client.commands = new Collection();
const commands = [];

const commandFiles = fs
    .readdirSync('./commands')
    .map((folder) =>
        fs
            .readdirSync(`./commands/${folder}`)
            .filter((file) => file.endsWith('.js'))
            .map((file) => `./commands/${folder}/${file}`))
    .flat();

for(const file of commandFiles) {
    /** @type {Command} */
    const command = require(`${file}`);
    if(Object.keys(command).length === 0) continue;
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

void (async() => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(client_id), {
            body: commands
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch(error) {
        console.error(error);
    }
})();

const interactionCreate = require('./events/interactionCreate');

client.on(interactionCreate.name, (interaction) => interactionCreate.execute(interaction));

client.once('ready', () => {
    client.playerManager = new Map();
    client.triviaManager = new Map();
    client.guildData = new Collection();
    client.user.setActivity('/', {type: 'WATCHING'});
    mongoose
        .connect(encodeURI(mongo_URI), {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(() => {
            console.log('Mongo is ready');
        })
        .catch(console.error);

    console.log('Ready!');
});

void client.login(token);
