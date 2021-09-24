import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'chucknorris';
export const description = 'Get a satirical fact about Chuck Norris!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    // thanks to https://api.chucknorris.io
    return fetch('https://api.chucknorris.io/jokes/random')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#CD7232')
                .setAuthor('Chuck Norris', 'https://i.imgur.com/wr1g92v.png', 'https://chucknorris.io')
                .setDescription(json.value)
                .setTimestamp()
                .setFooter('Powered by chucknorris.io', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err: unknown) => {
            console.error(err);
            return interaction.reply(':x: An error occured, Chuck is investigating this!');
        });
};

