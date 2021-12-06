import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'fortune';
export const description = 'Replies with a fortune cookie tip!';
export const deferred = false;

const url = 'http://yerkee.com/api/fortune';

const embedColour = '#F4D190';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const json = await fetchJSON<{fortune: string}>(url);
    const embed = new MessageEmbed()
        .setColor(embedColour)
        .setAuthor('Fortune Cookie', 'https://i.imgur.com/58wIjK0.png', 'https://yerkee.com')
        .setDescription(json.fortune)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} yerkee.com`, '');
    return {embeds: [embed]};
};
