import type {CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'insult';
export const description = 'Generate an evil insult!';
export const deferred = false;

const url = 'https://evilinsult.com/generate_insult.php?lang=en&type=json';

export const execute = async(): Promise<CommandReturn> => {
    // thanks to https://evilinsult.com :)
    const json = await fetchJSON<{insult: string}>(url);
    const embed = new MessageEmbed()
        .setColor('#E41032')
        .setAuthor('Evil Insult', 'https://i.imgur.com/bOVpNAX.png', 'https://evilinsult.com')
        .setDescription(json.insult)
        .setTimestamp()
        .setFooter('Powered by evilinsult.com', '');
    return {embeds: [embed]};
};

