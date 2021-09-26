import {SlashCommandBuilder} from '@discordjs/builders';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';

export const name = 'trump';
export const description = 'Get a random quote from Donald Trump!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    return fetch<{value: string, appeared_at: number}>('https://api.tronalddump.io/random/quote')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#BB7D61')
                .setAuthor('Donald Trump', 'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg')
                .setDescription(json.value)
                .setTimestamp(json.appeared_at)
                .setFooter('Powered by tronalddump.io! Quote was posted', ' ');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err: unknown) => {
            console.error(err);
            return interaction.reply('Failed to deliver quote :sob:');
        });
};
