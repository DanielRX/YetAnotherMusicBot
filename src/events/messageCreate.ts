import {commands} from '../utils/client';
import type {CustomInteraction} from '../utils/types';
import {logger} from '../utils/logging';
import type {Message} from 'discord.js';
import {getAndFillMessage} from '../utils/messages';

export const name = 'messageCreate';

const PREFIX = '#';

export const execute = async(message: Message): Promise<void> => {
    if(!message.content.startsWith(PREFIX)) { return; }
    const commandName = message.content.split(' ')[0].replace(PREFIX, '');
    if(!commands.has(commandName)) return;

    try {
        logger.verbose({user: message.author, command: commandName});
        const command = commands.get(commandName)!;
        const params: any = message.content.split(' ').slice(1);
        logger.verbose(params);
        const output = await command.execute(undefined as unknown as CustomInteraction, getAndFillMessage(command.name, 'en_gb'), ...params);
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
