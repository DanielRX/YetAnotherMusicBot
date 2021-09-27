import {SlashCommandBuilder} from '@discordjs/builders';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';

export const name = 'trump';
export const description = 'Get a random quote from Donald Trump!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    return fetch<{value: string, appeared_at: number}>('https://api.tronalddump.io/random/quote')
        .then(async(res) => res.json())
        .then(async(json) => {
            const embed = new MessageEmbed()
                .setColor('#BB7D61')
                .setAuthor('Donald Trump', 'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg')
                .setDescription(json.value)
                .setTimestamp(json.appeared_at)
                .setFooter('Powered by tronalddump.io! Quote was posted', ' ');
            return interaction.reply({embeds: [embed]});
        })
        .catch(async(e: unknown) => {
            console.error(e);
            return interaction.reply('Failed to deliver quote :sob:');
        });
};
