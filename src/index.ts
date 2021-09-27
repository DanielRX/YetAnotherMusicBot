import fs from 'fs';
import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import {Client, Collection, Intents} from 'discord.js';
import mongoose from 'mongoose';
import type {Command, CustomClient, CustomInteraction} from './utils/types';

import {config} from './utils/config';

const rest = new REST({version: '9'}).setToken(config.token);

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES];

const client: CustomClient = new Client({intents}) as any;

client.commands = new Collection();
const commands = [];

const commandFiles = fs
    .readdirSync('./commands')
    .map((folder) => fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith('.ts'))
        .map((file) => `./commands/${folder}/${file}`))
    .flat();

for(const file of commandFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
    const command: Command = require(`${file}`);
    if(Object.keys(command).length === 0) continue;
    commands.push(command.data.toJSON());
    (client as any).commands.set(command.data.name, command);
}

void (async() => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(config.client_id) as any, {body: commands});
        console.log('Successfully reloaded application (/) commands.');
    } catch(e: unknown) {
        console.error(e);
    }
})();

import * as interactionCreate from './events/interactionCreate';

client.on(interactionCreate.name, async(interaction) => interactionCreate.execute(interaction as CustomInteraction));

client.once('ready', () => {
    (client as any).playerManager = new Map();
    (client as any).triviaManager = new Map();
    (client as any).guildData = new Collection();
    client.user?.setActivity('/', {type: 'WATCHING'});
    mongoose
        .connect(encodeURI(config.mongo_URI), {useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => { console.log('Mongo is ready'); })
        .catch(console.error);

    console.log('Ready!');
});

void client.login(config.token);
