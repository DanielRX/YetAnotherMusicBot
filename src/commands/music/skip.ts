import type {CommandReturn, CustomInteraction, GuildData} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager, guildData} from '../../utils/client';

export const name = 'skip';
export const description = 'Skip the currently playing song!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return 'Please join a voice channel and try again!'; }

    const player = playerManager.get(interaction.guildId);
    const guild = guildData.get(interaction.guild.id) as unknown as GuildData;
    if(player?.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return 'There is no song playing right now!'; }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return 'You must be in the same voice channel as the bot in order to skip!'; }
    if(guild.triviaData.isTriviaRunning) { return `You can't skip a trivia! Use end-trivia command instead`; }
    player.audioPlayer.stop();
    return `Skipped **${playerManager.get(interaction.guildId)?.nowPlaying?.name}**`;
};

