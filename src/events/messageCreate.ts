import {commands} from '../utils/client';
import type {CustomInteraction} from '../utils/types';
import {logger} from '../utils/logging';
import type {Message} from 'discord.js';
import {messages} from '../utils/messages';
import {camelCase} from 'change-case';

export const name = 'messageCreate';

const PREFIX = '#';

export const execute = async(message: Message): Promise<void> => {
    if(!message.content.startsWith(PREFIX)) { return; }
    const commandName = message.content.split(' ')[0].replace(PREFIX, '');
    if(!commands.has(commandName)) return;

    try {
        logger.verbose({user: message.author, command: commandName});
        const command = commands.get(commandName)!;
        const paramsIn: (string | undefined)[] = message.content.split(' ').slice(1);
        const params: any = {};
        const opts = command.options ?? [];
        for(let i = 0; i < opts.length; i++) {
            const opt = paramsIn[i];
            switch(opts[i].type) {
                case 'boolean': { params[camelCase(opts[i].name)] = (Boolean(opt ?? opts[i].default)); break; }
                case 'string': { params[camelCase(opts[i].name)] = (`${opt ?? opts[i].default}`); break; }
                case 'integer': { params[camelCase(opts[i].name)] = (Number(opt ?? opts[i].default)); break; }
                case 'user': { params[camelCase(opts[i].name)] = (opt ?? opts[i].default); break; }
            }
        }
        // const params: any = message.content.split(' ').slice(1).map((p, i) => ({[camelCase(command.options![i].name)]: p})).reduce((a, b) => ({...a, ...b}), {});
        logger.verbose(params);
        const output = await command.execute({message, interaction: undefined as unknown as CustomInteraction, messages: await messages('en_gb'), params, guildId: message.guildId ?? ''});
        if(typeof output !== 'undefined') {
            if(typeof output !== 'string' && 'pages' in output) {
                await message.channel.send('Sorry, this command only works with / commands enabled!');
            } else {
                await message.channel.send(output);
            }
        }
    } catch(e: unknown) {
        logger.error(e);
        await message.channel.send({content: 'There was an error while executing this command!'});
    }
};
