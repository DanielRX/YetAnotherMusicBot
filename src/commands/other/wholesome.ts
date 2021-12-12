import type {CommandInput, CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {fetchJSON} from '../../utils/utils';

export const name = 'wholesome';
export const description = 'Get a random wholesome affirmations!';
export const deferred = false;

const embedColour = '#FFD77A';

const url = 'https://www.affirmations.dev/';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const {affirmation} = await fetchJSON<{affirmation: string}>(url);
    const quoteEmbed = new MessageEmbed({color: embedColour})
        .setAuthor('Wholesome!', 'https://i.imgur.com/Cnr6cQb.png', 'https://affirmations.dev')
        .setDescription(`*"${affirmation}*"`)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} affirmations.dev`);

        return {embeds: [quoteEmbed]};
};

