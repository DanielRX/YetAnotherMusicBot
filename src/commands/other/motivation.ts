import type {CommandInput, CommandReturn} from '../../utils/types';
import fs from 'fs-extra';
import {MessageEmbed} from 'discord.js';
import {randomEl} from '../../utils/utils';

export const name = 'motivation';
export const description = 'Get a random motivational quote!';
export const deferred = false;

type Data = {quotes: ({text: string, author: string})[]};

const embedColour = '#FFD77A';

// thanks to https://type.fit/api/quotes
export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const jsonQuotes = fs.readJSONSync('./resources/quotes/motivational.json', 'utf8') as Data;
    const randomQuote = randomEl(jsonQuotes.quotes);

    const quoteEmbed = new MessageEmbed()
        .setAuthor('Motivational Quote', 'https://i.imgur.com/Cnr6cQb.png', 'https://type.fit')
        .setDescription(`*"${randomQuote.text}*"\n\n-${randomQuote.author}`)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} type.fit`)
        .setColor(embedColour);
    return {embeds: [quoteEmbed]};
};

