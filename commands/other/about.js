// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');

const name = 'about';
const description = 'Info about the bot and its creator!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    return interaction.reply('Made by @DanielRX#6669 with :heart: code is available on GitHub (coming soon)');
};

module.exports = {data, execute, name, description};
