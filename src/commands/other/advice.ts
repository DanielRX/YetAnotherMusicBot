import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import {logger} from '../../utils/logging';

export const name = 'advice';
export const description = 'Get some advice!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    return fetch<{slip: {advice: string}}>('https://api.adviceslip.com/advice')
        .then(async(res) => res.json())
        .then(async(json) => {
            const embed = new MessageEmbed()
                .setColor('#403B3A')
                .setAuthor('Advice Slip', 'https://i.imgur.com/8pIvnmD.png', 'https://adviceslip.com/')
                .setDescription(json.slip.advice)
                .setTimestamp()
                .setFooter('Powered by adviceslip.com', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch(async(e: unknown) => {
            logger.error(e);
            return interaction.reply('Failed to deliver advice :sob:');
        });
};

