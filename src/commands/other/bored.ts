import type {CommandReturn, MessageFunction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'bored';
export const description = 'Generate a random activity!';
export const deferred = false;

export const execute = async(message: MessageFunction): Promise<CommandReturn> => {
    const json = await fetch<{activity: string}>('https://www.boredapi.com/api/activity?participants=1').then(async(res) => res.json());
    const embed = new MessageEmbed()
        .setColor('#6BA3FF')
        .setAuthor('Bored Activites', 'https://i.imgur.com/7Y2F38n.png', 'https://www.boredapi.com/')
        .setDescription(json.activity)
        .setTimestamp()
        .setFooter('Powered by boredapi.com', '');
    return {embeds: [embed]};
};
