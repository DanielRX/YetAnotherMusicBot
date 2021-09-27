import type {CustomInteraction, GuildData} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {AudioPlayerStatus} from '@discordjs/voice';

export const name = 'skip';
export const description = 'Skip the currently playing song!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return interaction.reply('Please join a voice channel and try again!'); }

    const player = interaction.client.playerManager.get(interaction.guildId);
    const guildData = interaction.guild.client.guildData.get(interaction.guild.id) as unknown as GuildData;
    if(player?.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return interaction.reply('There is no song playing right now!'); }
    if(voiceChannel.id !== interaction.guild.me?.voice?.channel?.id) { return interaction.reply('You must be in the same voice channel as the bot in order to skip!'); }
    if(guildData.triviaData.isTriviaRunning) { return interaction.reply(`You can't skip a trivia! Use end-trivia command instead`); }
    void interaction.reply(`Skipped **${interaction.client.playerManager.get(interaction.guildId)?.nowPlaying?.name}**`);
    player?.audioPlayer.stop();
};

