import type {CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'chucknorris';
export const description = 'Get a satirical fact about Chuck Norris!';
export const deferred = false;

const url = 'https://api.chucknorris.io/jokes/random';

export const execute = async(): Promise<CommandReturn> => {
    // thanks to https://api.chucknorris.io
    const json = await fetchJSON<{value: string}>(url);
    const embed = new MessageEmbed()
        .setColor('#CD7232')
        .setAuthor('Chuck Norris', 'https://i.imgur.com/wr1g92v.png', 'https://chucknorris.io')
        .setDescription(json.value)
        .setTimestamp()
        .setFooter('Powered by chucknorris.io', '');
    return {embeds: [embed]};
};

