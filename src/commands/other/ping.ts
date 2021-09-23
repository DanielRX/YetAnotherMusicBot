// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');

const name = 'ping';
const description = 'Replies with Pong!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    return interaction.reply('Pong!');
};

module.exports = {data, execute, name, description};
