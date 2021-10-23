import {commands} from '../utils/client';
import type {CustomInteraction} from '../utils/types';
import {logger} from '../utils/logging';
import type {Message} from 'discord.js';
import {getAndFillMessage} from '../utils/messages';
import {camelCase} from "change-case";

export const name = 'messageCreate';

const PREFIX = '#';

export const execute = async(message: Message): Promise<void> => {
    if(!message.content.startsWith(PREFIX)) { return; }
    const commandName = message.content.split(' ')[0].replace(PREFIX, '');
    if(!commands.has(commandName)) return;

    try {
        logger.verbose({user: message.author, command: commandName});
        const command = commands.get(commandName)!;
        // const params: any = {};
        // for(const option of command.options ?? []) {
        //     const opt = interaction.options.get(option.name, option.required);
        //     switch(option.type) {
        //         case 'boolean': { params[camelCase(option.name)] = (Boolean(opt?.value ?? option.default)); break; }
        //         case 'string': { params[camelCase(option.name)] = (`${opt?.value ?? option.default}`); break; }
        //         case 'integer': { params[camelCase(option.name)] = (Number(opt?.value ?? option.default)); break; }
        //         case 'user': { params[camelCase(option.name)] = (opt?.user ?? option.default); break; }
        //     }
        // }
        const params: any = message.content.split(' ').slice(1).map((p, i) => ({[camelCase(command.options![i].name)]: p})).reduce((a, b) => ({...a, ...b}), {});
        logger.verbose(params);
        const output = await command.execute({interaction: undefined as unknown as CustomInteraction, message: getAndFillMessage(command.name, 'en_gb'), params, guildId: message.guildId ?? ''});
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
