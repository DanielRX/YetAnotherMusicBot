import type {CommandInput, CommandReturn} from '../../utils/types';
import fs from 'fs-extra';
import {MessageEmbed} from 'discord.js';

export const name = 'copypasta';
export const description = 'Get a random copypasta! (Filters coming soon)';
export const deferred = false;

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const data = fs.readJSONSync('././resources/quotes/copypasta.json', 'utf8') as string[];

    const randomEl = data[Math.floor(Math.random() * data.length)];

    const quoteEmbed = new MessageEmbed()
        .setTitle('Copypasta')
        .setDescription(`${randomEl}`)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY} you!`)
        .setColor('#FFD77A');
    return {embeds: [quoteEmbed]};
};

