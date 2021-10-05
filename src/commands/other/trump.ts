import {fetch} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import type {CommandReturn, MessageFunction} from '../../utils/types';

export const name = 'trump';
export const description = 'Get a random quote from Donald Trump!';
export const deferred = false;

export const execute = async(message: MessageFunction): Promise<CommandReturn> => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const json = await fetch<{value: string, appeared_at: number}>('https://api.tronalddump.io/random/quote').then(async(res) => res.json());
    const embed = new MessageEmbed()
        .setColor('#BB7D61')
        .setAuthor('Donald Trump', 'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg')
        .setDescription(json.value)
        .setTimestamp(json.appeared_at)
        .setFooter('Powered by tronalddump.io! Quote was posted', ' ');
    return {embeds: [embed]};
};
