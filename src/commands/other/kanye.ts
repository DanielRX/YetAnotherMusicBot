import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {logger} from '../../utils/logging';

export const name = 'kanye';
export const description = 'Get a random Kanye quote.';
export const deferred = false;

const makeEmbed = (quote: string) => new MessageEmbed()
    .setColor('#AF6234')
    .setAuthor('Kanye West', 'https://i.imgur.com/SsNoHVh.png')
    .setDescription(quote)
    .setTimestamp()
    .setFooter('Powered by kanye.rest', '');

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    return fetch<{quote: string}>('https://api.kanye.rest/?format=json')
        .then(async(res) => res.json())
        .then(async(json) => interaction.reply({embeds: [makeEmbed(json.quote)]}))
        .catch(async(e: unknown) => {
            logger.error(e);
            return interaction.reply('Failed to deliver quote :sob:');
        });
};

