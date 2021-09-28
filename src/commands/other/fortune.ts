import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import {logger} from '../../utils/logging';

export const name = 'fortune';
export const description = 'Replies with a fortune cookie tip!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    try {
        const json = await fetch<{fortune: string}>('http://yerkee.com/api/fortune').then(async(res) => res.json());
        const embed = new MessageEmbed()
            .setColor('#F4D190')
            .setAuthor('Fortune Cookie', 'https://i.imgur.com/58wIjK0.png', 'https://yerkee.com')
            .setDescription(json.fortune)
            .setTimestamp()
            .setFooter('Powered by yerkee.com', '');
        return interaction.reply({embeds: [embed]});
    } catch(e: unknown) {
        logger.error(e);
        return interaction.reply(':x: Could not obtain a fortune cookie!');
    }
};
