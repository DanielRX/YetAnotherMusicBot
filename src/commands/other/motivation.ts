import type {CommandInput, CommandReturn, MotivationData} from '../../utils/types';
import fs from 'fs-extra';
import {MessageEmbed} from 'discord.js';
import {randomEl} from '../../utils/utils';

export const name = 'motivation';
export const description = 'Get a random motivational quote!';
export const deferred = false;

const embedColour = '#FFD77A';

// thanks to https://type.fit/api/quotes
export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const jsonQuotes = fs.readJSONSync('./resources/quotes/motivational.json', 'utf8') as MotivationData;
    const randomQuote = randomEl(jsonQuotes.quotes);

    const quoteEmbed = new MessageEmbed({color: embedColour})
        .setAuthor('Motivational Quote', 'https://i.imgur.com/Cnr6cQb.png', 'https://type.fit')
        .setDescription(`*"${randomQuote.text}*"\n\n-${randomQuote.author}`)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} type.fit`);
    return {embeds: [quoteEmbed]};
};

