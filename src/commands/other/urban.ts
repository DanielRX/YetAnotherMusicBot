import {MessageEmbed} from 'discord.js';
import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';

export const name = 'urban';
export const description = 'Get definitions from urban dictonary.';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'query', description: 'What do you want to search for?', required: true, choices: []},
];

const embedColour = '#BB7D61';

type UrbanReturn = {list: ({definition: string, permalink: string})[]};

export const execute = async({params: {query}, messages}: CommandInput<{query: string}>): Promise<CommandReturn> => {
    const json = await fetchJSON<UrbanReturn>(`https://api.urbandictionary.com/v0/define?term=${query}`);
    const embed = new MessageEmbed()
        .setColor(embedColour)
        .setTitle(query)
        .setAuthor('Urban Dictionary', 'https://i.imgur.com/vdoosDm.png', 'https://urbandictionary.com')
        .setDescription(`*${json.list[Math.floor(Math.random() * 1)].definition}*`)
        .setURL(json.list[0].permalink)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} UrbanDictionary`, '');
    return {embeds: [embed]};
};
