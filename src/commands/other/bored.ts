import type {CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'bored';
export const description = 'Generate a random activity!';
export const deferred = false;

const url = 'https://www.boredapi.com/api/activity?participants=1';
export const execute = async(): Promise<CommandReturn> => {
    const json = await fetchJSON<{activity: string}>(url);
    const embed = new MessageEmbed()
        .setColor('#6BA3FF')
        .setAuthor('Bored Activites', 'https://i.imgur.com/7Y2F38n.png', 'https://www.boredapi.com/')
        .setDescription(json.activity)
        .setTimestamp()
        .setFooter('Powered by boredapi.com', '');
    return {embeds: [embed]};
};
