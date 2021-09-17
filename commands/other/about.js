// @ts-check
const {CommandInteraction} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder().setName('about').setDescription('Info about the bot and its creator!'),
    /**
     * @param {CommandInteraction} interaction
     * @returns {Promise<void>}
     */
    execute(interaction) {
        return interaction.reply('Made by @DanielRX#6669 with :heart: code is available on GitHub (coming soon)');
    }
};
