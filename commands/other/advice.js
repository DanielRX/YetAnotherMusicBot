// @ts-check
const fetch = require('node-fetch');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');

const name = 'advice';
const description = 'Get some advice!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    return fetch('https://api.adviceslip.com/advice')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#403B3A')
                .setAuthor('Advice Slip', 'https://i.imgur.com/8pIvnmD.png', 'https://adviceslip.com/')
                .setDescription(json.slip.advice)
                .setTimestamp()
                .setFooter('Powered by adviceslip.com', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err) => {
            console.error(err);
            return interaction.reply('Failed to deliver advice :sob:');
        });
};

module.exports = {data, execute};
