import type {CommandReturn} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import {logger} from '../../utils/logging';

export const name = 'insult';
export const description = 'Generate an evil insult!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    // thanks to https://evilinsult.com :)
    return fetch<{insult: string}>('https://evilinsult.com/generate_insult.php?lang=en&type=json')
        .then(async(res) => res.json())
        .then(async(json) => {
            const embed = new MessageEmbed()
                .setColor('#E41032')
                .setAuthor('Evil Insult', 'https://i.imgur.com/bOVpNAX.png', 'https://evilinsult.com')
                .setDescription(json.insult)
                .setTimestamp()
                .setFooter('Powered by evilinsult.com', '');
            return {embeds: [embed]};
        })
        .catch(async(e: unknown) => {
            logger.error(e);
            return ':x: Failed to deliver insult!';
        });
};

