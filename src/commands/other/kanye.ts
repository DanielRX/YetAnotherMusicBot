import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import type {CommandReturn} from '../../utils/types';

export const name = 'kanye';
export const description = 'Get a random Kanye quote.';
export const deferred = false;

const makeEmbed = (quote: string) => new MessageEmbed()
    .setColor('#AF6234')
    .setAuthor('Kanye West', 'https://i.imgur.com/SsNoHVh.png')
    .setDescription(quote)
    .setTimestamp()
    .setFooter('Powered by kanye.rest', '');

export const execute = async(): Promise<CommandReturn> => {
    const json = await fetch<{quote: string}>('https://api.kanye.rest/?format=json').then(async(res) => res.json());
    return {embeds: [makeEmbed(json.quote)]};
};

