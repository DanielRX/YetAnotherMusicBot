import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'trump';
export const description = 'Get a random quote from Donald Trump!';
export const deferred = false;

const url = 'https://api.tronalddump.io/random/quote';

const embedColour = '#BB7D61';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const json = await fetchJSON<{value: string, appeared_at: number}>(url);
    const embed = new MessageEmbed()
        .setColor(embedColour)
        .setAuthor('Donald Trump', 'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg')
        .setDescription(json.value)
        .setTimestamp(json.appeared_at)
        .setFooter(`${messages.POWERED_BY} tronalddump.io! Quote was posted`, ' ');
    return {embeds: [embed]};
};
