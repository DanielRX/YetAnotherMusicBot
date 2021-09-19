// @ts-check
const {CommandInteraction} = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    /**
     * @param {CommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if(!interaction.isCommand()) return;

        if(!interaction.client.commands.has(interaction.commandName)) return;

        try {
            await interaction.client.commands.get(interaction.commandName).execute(interaction);
        } catch(error) {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }
};