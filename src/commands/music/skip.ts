import { CustomInteraction } from '../../utils/types';

// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');

export const name = 'skip';
export const description = 'Skip the currently playing song!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return interaction.reply('Please join a voice channel and try again!'); }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player?.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return interaction.reply('There is no song playing right now!'); }
    if(voiceChannel.id !== interaction.guild.me?.voice?.channel?.id) { return interaction.reply('You must be in the same voice channel as the bot in order to skip!'); }
    if(interaction.guild.client.guildData.get(interaction.guild.id)?.triviaData.isTriviaRunning) { return interaction.reply(`You can't skip a trivia! Use end-trivia command instead`); }
    void interaction.reply(`Skipped **${interaction.client.playerManager.get(interaction.guildId)?.nowPlaying?.title}**`);
    player?.audioPlayer.stop();
};

