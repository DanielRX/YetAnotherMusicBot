// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    /**
     * @param {import('../../').CustomInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        return interaction.reply('Pong!');
    }
};
