// @ts-check

const {CommandInteraction} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');
const createGuildData = require('../../utils/createGuildData');
const {arrayMove} = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move a song to a desired position in queue!')
        .addIntegerOption((option) =>
            option
                .setName('oldposition')
                .setDescription('What is the position of the song you want to move?')
                .setRequired(true))
        .addIntegerOption((option) =>
            option
                .setName('newposition')
                .setDescription('What position do you want to move the song to?')
                .setRequired(true)),
    /**
     * @param {CommandInteraction} interaction
     * @returns {Promise<void>}
     */
    execute(interaction) {
        if(!interaction.client.guildData.get(interaction.guildId)) {
            interaction.client.guildData.set(interaction.guildId, createGuildData());
        }
        const guildData = interaction.client.guildData.get(interaction.guildId);
        const player = interaction.client.playerManager.get(interaction.guildId);
        if(!player) {
            return interaction.reply('There is no song playing now!');
        }
        if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
            return interaction.reply('There is no song playing now!');
        }
        if(player.audioPlayer.state.status === AudioPlayerStatus.Playing && guildData.triviaData.isTriviaRunning) {
            return interaction.reply(`You can't use this command while a trivia is running!`);
        }
        if(interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) {
            return interaction.reply(`You must be in the same voice channel as the bot in order to use that!`);
        }
        const oldPosition = interaction.options.get('oldposition').value;
        const newPosition = interaction.options.get('newposition').value;

        if(oldPosition < 1 || oldPosition > player.queue.length || newPosition < 1 || newPosition > player.queue.length || oldPosition == newPosition) {
            return interaction.reply(':x: Try again and enter a valid song position number');
        }

        const songName = player.queue[oldPosition - 1].title;
        arrayMove(player.queue, oldPosition - 1, newPosition - 1);

        interaction.reply(`**${songName}** moved to position ${newPosition}`);
    }
};
