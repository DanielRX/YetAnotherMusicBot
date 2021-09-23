// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');

export const name = 'about';
export const descriptionription = 'Info about the bot and its creator!';

export const datast data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const executeexecute = async(interaction) => {
    return interaction.reply('Made by @DanielRX#6669 with :heart: code is available on GitHub (coming soon)');
};


