import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'insult';
export const description = 'Generate an evil insult!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    // thanks to https://evilinsult.com :)
    return fetch<{insult: string}>('https://evilinsult.com/generate_insult.php?lang=en&type=json')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#E41032')
                .setAuthor('Evil Insult', 'https://i.imgur.com/bOVpNAX.png', 'https://evilinsult.com')
                .setDescription(json.insult)
                .setTimestamp()
                .setFooter('Powered by evilinsult.com', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err: unknown) => {
            console.error(err);
            return interaction.reply(':x: Failed to deliver insult!');
        });
};

