import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'insult';
export const description = 'Generate an evil insult!';
export const deferred = false;

const url = 'https://evilinsult.com/generate_insult.php?lang=en&type=json';

const embedColour = '#E41032';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    // thanks to https://evilinsult.com :)
    const json = await fetchJSON<{insult: string}>(url);
    const embed = new MessageEmbed()
        .setColor(embedColour)
        .setAuthor('Evil Insult', 'https://i.imgur.com/bOVpNAX.png', 'https://evilinsult.com')
        .setDescription(json.insult)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} evilinsult.com`, '');
    return {embeds: [embed]};
};

