import type {CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'fortune';
export const description = 'Replies with a fortune cookie tip!';
export const deferred = false;

const url = 'http://yerkee.com/api/fortune';

export const execute = async(): Promise<CommandReturn> => {
    const json = await fetchJSON<{fortune: string}>(url);
    const embed = new MessageEmbed()
        .setColor('#F4D190')
        .setAuthor('Fortune Cookie', 'https://i.imgur.com/58wIjK0.png', 'https://yerkee.com')
        .setDescription(json.fortune)
        .setTimestamp()
        .setFooter('Powered by yerkee.com', '');
    return {embeds: [embed]};
};
