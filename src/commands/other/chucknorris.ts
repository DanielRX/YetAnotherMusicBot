import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import {logger} from '../../utils/logging';

export const name = 'chucknorris';
export const description = 'Get a satirical fact about Chuck Norris!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    // thanks to https://api.chucknorris.io
    return fetch<{value: string}>('https://api.chucknorris.io/jokes/random')
        .then(async(res) => res.json())
        .then(async(json) => {
            const embed = new MessageEmbed()
                .setColor('#CD7232')
                .setAuthor('Chuck Norris', 'https://i.imgur.com/wr1g92v.png', 'https://chucknorris.io')
                .setDescription(json.value)
                .setTimestamp()
                .setFooter('Powered by chucknorris.io', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch(async(e: unknown) => {
            logger.error(e);
            return interaction.reply(':x: An error occured, Chuck is investigating this!');
        });
};

