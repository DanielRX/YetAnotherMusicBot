import fs from 'fs';
import {REST} from '@discordjs/rest';
import {Routes} from 'discord-api-types/v9';
import mongoose from 'mongoose';
import type {Command, CustomInteraction} from './utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {setupOption} from '../../utils/utils';
import {client, commands} from './utils/client';
import {config} from './utils/config';

const rest = new REST({version: '9'}).setToken(config.token);

const commandsArr = [];

const commandFiles = fs
    .readdirSync('./commands')
    .map((folder) => fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith('.ts'))
        .map((file) => `./commands/${folder}/${file}`))
    .flat();

for(const file of commandFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
    const command = require(`${file}`) as Command;
    if(Object.keys(command).length === 0) continue;
    let data: any = new SlashCommandBuilder().setName(command.name).setDescription(command.description);
    for(const option of command.options) {
        switch(option.type) {
            case 'string': data = data.addStringOption(setupOption(option)); break;
            case 'user': data = data.addUserOption(setupOption(option)); break;
            case 'boolean': data = data.addBooleanOption(setupOption(option)); break;
            case 'integer': data = data.addIntegerOption(setupOption(option)); break;
        }
    }

    commandsArr.push(command.data.toJSON());
    commands.set(command.data.name, command);
}

void (async() => {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(config.clientId) as any, {body: commandsArr});
        console.log('Successfully reloaded application (/) commands.');
    } catch(e: unknown) {
        console.error(e);
    }
})();

import * as interactionCreate from './events/interactionCreate';

client.on(interactionCreate.name, async(interaction) => interactionCreate.execute(interaction as CustomInteraction));

client.once('ready', () => {
    client.user?.setActivity('/', {type: 'WATCHING'});
    mongoose
        .connect(encodeURI(config.mongoURI), {useNewUrlParser: true, useUnifiedTopology: true})
        .then(() => { console.log('Mongo is ready'); })
        .catch(console.error);

    console.log('Ready!');
});

void client.login(config.token);
