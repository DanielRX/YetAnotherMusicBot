import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'chucknorris';
export const description = 'Get a satirical fact about Chuck Norris!';
export const deferred = false;

const url = 'https://api.chucknorris.io/jokes/random';

const embedColour = '#CD7232';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    // thanks to https://api.chucknorris.io
    const json = await fetchJSON<{value: string}>(url);
    const embed = new MessageEmbed({color: embedColour})
        .setAuthor('Chuck Norris', 'https://i.imgur.com/wr1g92v.png', 'https://chucknorris.io')
        .setDescription(json.value)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} chucknorris.io`, '');
    return {embeds: [embed]};
};

