// @ts-check

const fs = require('fs');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const {Client, Collection, Intents, GuildMember, Message} = require('discord.js');
const {token, mongo_URI, client_id} = require('./config.json');
const mongoose = require('mongoose');
const { AudioPlayer, VoiceConnection } = require('@discordjs/voice');
const TriviaPlayer = require('./utils/music/TriviaPlayer');

const rest = new REST({version: '9'}).setToken(token);

/**
 * @typedef GuildData
 * @type {{triviaData: {isTriviaRunning: boolean}, queueHistory: Track[]}}
 */

/**
 * @typedef Track
 * @type {{title: string, url: string, singer: string}}
 */

/**
 * @typedef CustomAudioPlayer
 * @type {{audioPlayer: AudioPlayer, loopTimes: number, nowPlaying: {title: string}, connection: VoiceConnection, loopSong: boolean, loopQueue: boolean, queue: Track[], commandLock: boolean, length: number, queueHistory: Track[]}}
 */

/**
 * @typedef CustomClient
 * @type {Client & {playerManager: Map<string, CustomAudioPlayer>; commands: Collection<string, any>, guildData: Map<string, GuildData>, triviaManager: Map<string, TriviaPlayer>}}
 */

/**
 * @typedef CustomInteraction
 * @type {Omit<import('discord.js').CommandInteraction, 'deferReply'> & {client: CustomClient, guild: {client: CustomClient}, member: GuildMember, deferReply: (x?: {fetchReply: boolean}) => Promise<import('discord.js').Message>}}
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
    const command = require(`${file}`);
    if(Object.keys(command).length === 0) continue;
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

(async() => {
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

const eventFiles = fs
    .readdirSync('./events')
    .filter((file) => file.endsWith('.js'));

for(const file of eventFiles) {
    const event = require(`./events/${file}`);
    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

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

client.login(token);
