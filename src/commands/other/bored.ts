import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';

export const name = 'bored';
export const description = 'Generate a random activity!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    return fetch<{activity: string}>('https://www.boredapi.com/api/activity?participants=1')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#6BA3FF')
                .setAuthor('Bored Activites', 'https://i.imgur.com/7Y2F38n.png', 'https://www.boredapi.com/')
                .setDescription(json.activity)
                .setTimestamp()
                .setFooter('Powered by boredapi.com', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err: unknown) => {
            console.error(err);
            return interaction.reply('Failed to deliver activity :sob:');
        });
};
