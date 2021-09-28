import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {logger} from '../../utils/logging';

export const name = 'urban';
export const description = 'Get definitions from urban dictonary.';

export const options = [
    {type: 'string' as const, name: 'query', description: 'What do you want to search for?', required: true, choices: []},
];

export const execute = async(interaction: CustomInteraction, query: string): Promise<void> => {
    return fetch<{list: ({definition: string, permalink: string})[]}>(`https://api.urbandictionary.com/v0/define?term=${interaction.options.get('query')?.value}`)
        .then(async(res) => res.json())
        .then(async(json) => {
            const embed = new MessageEmbed()
                .setColor('#BB7D61')
                .setTitle(query)
                .setAuthor('Urban Dictionary', 'https://i.imgur.com/vdoosDm.png', 'https://urbandictionary.com')
                .setDescription(`*${json.list[Math.floor(Math.random() * 1)].definition}*`)
                .setURL(json.list[0].permalink)
                .setTimestamp()
                .setFooter('Powered by UrbanDictionary', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch(async(e: unknown) => {
            logger.error(e); // no need to spam console for each time it doesn't find a query
            return interaction.reply('Failed to deliver definition :sob:');
        });
};
