import {AudioPlayerStatus} from '@discordjs/voice';
import type {CommandInput} from '../../utils/types';
import {playerManager} from '../../utils/client';

export const name = 'leave';
export const description = 'Leaves a voice channel if in one!';
export const deferred = false;

export const execute = async({interaction, messages}: CommandInput): Promise<string> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return messages.NOT_IN_VC(); }

    const player = playerManager.get(interaction.guildId);
    if(typeof player === 'undefined' || player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return messages.NO_SONG_PLAYING(); }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return messages.NOT_IN_SAME_VC(); }

    player.connection.destroy();
    playerManager.delete(interaction.guildId);
    return messages.LEFT_VC();
};

