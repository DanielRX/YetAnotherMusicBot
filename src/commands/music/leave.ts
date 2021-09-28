import {AudioPlayerStatus} from '@discordjs/voice';
import type {CustomInteraction} from '../../utils/types';
import {playerManager} from '../../utils/client';

export const name = 'leave';
export const description = 'Leaves a voice channel if in one!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<string> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return 'Please join a voice channel and try again!'; }

    const player = playerManager.get(interaction.guildId);
    if(typeof player === 'undefined' || player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return 'There is no song playing right now!'; }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return 'You must be in the same voice channel as the bot in order to skip!'; }

    player.connection.destroy();
    playerManager.delete(interaction.guildId);
    return 'Left your voice channel!';
};

