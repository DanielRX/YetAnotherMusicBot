import type {CustomInteraction, GuildData} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';
import {guildData, playerManager} from '../../utils/client';

export const name = 'loop';
export const description = 'Set a song to play on loop';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<string> => {
    if(!guildData.get(interaction.guildId)) {
        guildData.set(interaction.guildId, createGuildData());
    }
    const guild = guildData.get(interaction.guildId) as unknown as GuildData;
    const player = playerManager.get(interaction.guildId);
    if(!player) { return 'There is no song playing now!'; }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return 'There is no song playing now!'; }
    if(guild.triviaData.isTriviaRunning) { return `You can't use this command while a trivia is running!`; } // player.audioPlayer.state.status === AudioPlayerStatus.Playing
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) { return `You must be in the same voice channel as the bot in order to use that!`; }

    if(player.loopSong) {
        player.loopSong = false;
        return `**${player.nowPlaying?.name}** is no longer playing on repeat :repeat: `;
    }

    player.loopSong = true;
    return `**${player.nowPlaying?.name}** is now playing on repeat :repeat: `;
};

