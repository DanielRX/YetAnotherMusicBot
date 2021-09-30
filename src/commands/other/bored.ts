import type {CommandReturn} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import {logger} from '../../utils/logging';

export const name = 'bored';
export const description = 'Generate a random activity!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    return fetch<{activity: string}>('https://www.boredapi.com/api/activity?participants=1')
        .then(async(res) => res.json())
        .then(async(json) => {
            const embed = new MessageEmbed()
                .setColor('#6BA3FF')
                .setAuthor('Bored Activites', 'https://i.imgur.com/7Y2F38n.png', 'https://www.boredapi.com/')
                .setDescription(json.activity)
                .setTimestamp()
                .setFooter('Powered by boredapi.com', '');
            return {embeds: [embed]};
        })
        .catch(async(e: unknown) => {
            logger.error(e);
            return 'Failed to deliver activity :sob:';
        });
};
