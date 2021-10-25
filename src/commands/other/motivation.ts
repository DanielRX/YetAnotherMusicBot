import type {CommandReturn} from '../../utils/types';
import fs from 'fs-extra';
import {MessageEmbed} from 'discord.js';

export const name = 'motivation';
export const description = 'Get a random motivational quote!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    // thanks to https://type.fit/api/quotes

    const jsonQuotes = fs.readJSONSync('./resources/quotes/motivational.json', 'utf8') as {quotes: ({text: string, author: string})[]};
    const quoteArray = jsonQuotes.quotes;

    const randomQuote = quoteArray[Math.floor(Math.random() * quoteArray.length)];

    const quoteEmbed = new MessageEmbed()
        .setAuthor('Motivational Quote', 'https://i.imgur.com/Cnr6cQb.png', 'https://type.fit')
        .setDescription(`*"${randomQuote.text}*"\n\n-${randomQuote.author}`)
        .setTimestamp()
        .setFooter('Powered by type.fit')
        .setColor('#FFD77A');
    return {embeds: [quoteEmbed]};
};

