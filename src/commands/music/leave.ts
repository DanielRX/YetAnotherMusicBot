import {AudioPlayerStatus} from '@discordjs/voice';
import type {CustomInteraction} from '../../utils/types';
import {playerManager} from '../../utils/client';
import {getAndFillMessage} from '../../utils/messages';

export const name = 'leave';
export const description = 'Leaves a voice channel if in one!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<string> => {
    const message = getAndFillMessage('leave', 'en_gb'); // TODO: User/server locale?
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return message('NOT_IN_VC'); }

    const player = playerManager.get(interaction.guildId);
    if(typeof player === 'undefined' || player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return message('NO_SONG_PLAYING'); }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return message('NOT_IN_SAME_VC'); }

    player.connection.destroy();
    playerManager.delete(interaction.guildId);
    return message('LEFT_VC');
};

