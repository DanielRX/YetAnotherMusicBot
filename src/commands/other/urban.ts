// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {setupOption, fetch} = require('../../utils/utils');

export const namest name = 'urban';
export const description = 'Get definitions from urban dictonary.';

export const options = [
    {name: 'query', description: 'What do you want to search for?', required: true, choices: []},
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    return fetch(`https://api.urbandictionary.com/v0/define?term=${
        interaction.options.get('query').value
    }`)
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#BB7D61')
                .setTitle(`${interaction.options.get('query').value}`)
                .setAuthor('Urban Dictionary', 'https://i.imgur.com/vdoosDm.png', 'https://urbandictionary.com')
                .setDescription(`*${json.list[Math.floor(Math.random() * 1)].definition}*`)
                .setURL(json.list[0].permalink)
                .setTimestamp()
                .setFooter('Powered by UrbanDictionary', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch(() => {
            // console.error(err); // no need to spam console for each time it doesn't find a query
            return interaction.reply('Failed to deliver definition :sob:');
        });
};


