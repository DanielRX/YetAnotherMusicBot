import type {CommandReturn, MessageFunction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'chucknorris';
export const description = 'Get a satirical fact about Chuck Norris!';
export const deferred = false;

export const execute = async(message: MessageFunction): Promise<CommandReturn> => {
    // thanks to https://api.chucknorris.io
    const json = await fetch<{value: string}>('https://api.chucknorris.io/jokes/random').then(async(res) => res.json());
    const embed = new MessageEmbed()
        .setColor('#CD7232')
        .setAuthor('Chuck Norris', 'https://i.imgur.com/wr1g92v.png', 'https://chucknorris.io')
        .setDescription(json.value)
        .setTimestamp()
        .setFooter('Powered by chucknorris.io', '');
    return {embeds: [embed]};
};

