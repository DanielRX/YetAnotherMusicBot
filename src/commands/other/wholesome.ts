import type {CommandInput, CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {fetchJSON} from '../../utils/utils';

export const name = 'motivation';
export const description = 'Get a random motivational quote!';
export const deferred = false;

const embedColour = '#FFD77A';

const url = 'https://www.affirmations.dev/';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const {affirmation} = await fetchJSON<{affirmation: string}>(url);
    const quoteEmbed = new MessageEmbed()
        .setAuthor('Wholesome!', 'https://i.imgur.com/Cnr6cQb.png', 'https://affirmations.dev')
        .setDescription(`*"${affirmation}*"`)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} affirmations.dev`)
        .setColor(embedColour);
    return {embeds: [quoteEmbed]};
};

