import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'insult';
export const description = 'Generate an evil insult!';
export const deferred = false;

export const execute = async({}: CommandInput): Promise<CommandReturn> => {
    // thanks to https://evilinsult.com :)
    const json = await fetch<{insult: string}>('https://evilinsult.com/generate_insult.php?lang=en&type=json').then(async(res) => res.json());
    const embed = new MessageEmbed()
        .setColor('#E41032')
        .setAuthor('Evil Insult', 'https://i.imgur.com/bOVpNAX.png', 'https://evilinsult.com')
        .setDescription(json.insult)
        .setTimestamp()
        .setFooter('Powered by evilinsult.com', '');
    return {embeds: [embed]};
};

