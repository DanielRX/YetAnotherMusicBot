// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');

const name = 'skip';
const description = 'Skip the currently playing song!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);
/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return interaction.reply('Please join a voice channel and try again!'); }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return interaction.reply('There is no song playing right now!'); }
    if(voiceChannel.id !== interaction.guild.me.voice.channel.id) { return interaction.reply('You must be in the same voice channel as the bot in order to skip!'); }
    if(interaction.guild.client.guildData.get(interaction.guild.id).triviaData.isTriviaRunning) { return interaction.reply(`You can't skip a trivia! Use end-trivia command instead`); }
    interaction.reply(`Skipped **${interaction.client.playerManager.get(interaction.guildId).nowPlaying.title}**`);
    player.audioPlayer.stop();
};

module.exports = {data, execute};
