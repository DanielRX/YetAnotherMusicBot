// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');

export const name = 'ping';
export const description = 'Replies with Pong!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    return interaction.reply('Pong!');
};


