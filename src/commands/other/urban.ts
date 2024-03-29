import {MessageEmbed} from 'discord.js';
import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetch} from '../../utils/utils';

export const name = 'urban';
export const description = 'Get definitions from urban dictonary.';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'query', description: 'What do you want to search for?', required: true, choices: []},
];

export const execute = async({interaction, params: {query}}: CommandInput<{query: string}>): Promise<CommandReturn> => {
    const json = await fetch<{list: ({definition: string, permalink: string})[]}>(`https://api.urbandictionary.com/v0/define?term=${interaction.options.get('query')?.value}`).then(async(res) => res.json());
    const embed = new MessageEmbed()
        .setColor('#BB7D61')
        .setTitle(query)
        .setAuthor('Urban Dictionary', 'https://i.imgur.com/vdoosDm.png', 'https://urbandictionary.com')
        .setDescription(`*${json.list[Math.floor(Math.random() * 1)].definition}*`)
        .setURL(json.list[0].permalink)
        .setTimestamp()
        .setFooter('Powered by UrbanDictionary', '');
    return {embeds: [embed]};
};
