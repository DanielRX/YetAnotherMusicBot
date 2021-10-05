import type {CustomInteraction, GuildData, MessageFunction} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';
import {guildData, playerManager} from '../../utils/client';

export const name = 'loop';
export const description = 'Set a song to play on loop';
export const deferred = false;

export const execute = async(interaction: CustomInteraction, message: MessageFunction): Promise<string> => {
    if(!guildData.get(interaction.guildId)) {
        guildData.set(interaction.guildId, createGuildData());
    }
    const guild = guildData.get(interaction.guildId) as unknown as GuildData;
    const player = playerManager.get(interaction.guildId);
    if(!player) { return message('NO_SONG_PLAYING'); }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return message('NO_SONG_PLAYING'); }
    if(guild.triviaData.isTriviaRunning) { return message('TRIVIA_IS_RUNNING'); } // player.audioPlayer.state.status === AudioPlayerStatus.Playing
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) { return message('NOT_IN_SAME_VC'); }

    if(player.loopSong) {
        player.loopSong = false;
        return message('LOOP_DISABLED', {song: player.nowPlaying?.name ?? ''});
    }

    player.loopSong = true;
    return message('LOOP_ENABLED', {song: player.nowPlaying?.name ?? ''});
};

