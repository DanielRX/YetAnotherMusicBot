import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'kanye';
export const description = 'Get a random Kanye quote.';
export const deferred = false;

const embedColour = '#AF6234';

const makeEmbed = (quote: string, messages: CommandInput['messages']) => new MessageEmbed({color: embedColour})
    .setAuthor('Kanye West', 'https://i.imgur.com/SsNoHVh.png')
    .setDescription(quote)
    .setTimestamp()
    .setFooter(`${messages.POWERED_BY()} kanye.rest`, '');

const url = 'https://api.kanye.rest/?format=json';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const json = await fetchJSON<{quote: string}>(url);
    return {embeds: [makeEmbed(json.quote, messages)]};
};

