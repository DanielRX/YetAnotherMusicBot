// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');

const name = 'stop-trivia';
const description = 'End a music trivia (if one is in play)';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    const triviaPlayer = interaction.client.triviaManager.get(interaction.guildId);
    if(!triviaPlayer) {
        return interaction.reply(':x: No trivia is currently running!');
    }

    if(interaction.guild.me.voice.channel !== interaction.member.voice.channel) {
        return interaction.reply(':no_entry: Please join a voice channel and try again!');
    }

    if(!triviaPlayer.score.has(interaction.member.user.username)) {
        return interaction.reply(':stop_sign: You need to participate in the trivia in order to end it');
    }
    triviaPlayer.reset();
    interaction.client.triviaManager.delete(interaction.guildId);

    interaction.reply('Stopped the trivia! To start a new one, use the music-trivia command');
};

module.exports = {data, execute};
