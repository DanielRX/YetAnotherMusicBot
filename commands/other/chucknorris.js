// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fetch = require('node-fetch');
const {MessageEmbed} = require('discord.js');

const name = 'chucknorris';
const description = 'Get a satirical fact about Chuck Norris!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    // thanks to https://api.chucknorris.io
    return fetch('https://api.chucknorris.io/jokes/random')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#CD7232')
                .setAuthor('Chuck Norris', 'https://i.imgur.com/wr1g92v.png', 'https://chucknorris.io')
                .setDescription(json.value)
                .setTimestamp()
                .setFooter('Powered by chucknorris.io', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err) => {
            console.error(err);
            return interaction.reply(':x: An error occured, Chuck is investigating this!');
        });
};

module.exports = {data, execute};
