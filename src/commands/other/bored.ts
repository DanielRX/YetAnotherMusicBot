import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'bored';
export const description = 'Generate a random activity!';
export const deferred = false;

const url = 'https://www.boredapi.com/api/activity?participants=1';

const embedColour = '#6BA3FF';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const json = await fetchJSON<{activity: string}>(url);
    const embed = new MessageEmbed()
        .setColor(embedColour)
        .setAuthor('Bored Activites', 'https://i.imgur.com/7Y2F38n.png', 'https://www.boredapi.com/')
        .setDescription(json.activity)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY} boredapi.com`, '');
    return {embeds: [embed]};
};
