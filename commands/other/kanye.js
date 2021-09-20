// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fetch = require('node-fetch');
const {MessageEmbed} = require('discord.js');

const name = 'kanye';
const description = 'Get a random Kanye quote.';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

const makeEmbed = (quote) => new MessageEmbed()
    .setColor('#AF6234')
    .setAuthor('Kanye West', 'https://i.imgur.com/SsNoHVh.png')
    .setDescription(quote)
    .setTimestamp()
    .setFooter('Powered by kanye.rest', '');

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    return fetch('https://api.kanye.rest/?format=json')
        .then((res) => res.json())
        .then((json) => interaction.reply({embeds: [makeEmbed(json.quote)]}))
        .catch((err) => {
            interaction.reply('Failed to deliver quote :sob:');
            return console.error(err);
        });
};

module.exports = {data, execute};
