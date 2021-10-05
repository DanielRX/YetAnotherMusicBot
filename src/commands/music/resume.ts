import type {CommandReturn, CustomInteraction, MessageFunction} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager} from '../../utils/client';

export const name = 'resume';
export const description = 'Resume a paused track';
export const deferred = false;

export const execute = async(interaction: CustomInteraction, message: MessageFunction): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return message('NOT_IN_VC'); }

    const player = playerManager.get(interaction.guildId);
    if(!player) { return message('NO_SONG_PLAYING'); }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return message('NOT_IN_SAME_VC'); }
    if(player.audioPlayer.state.status == AudioPlayerStatus.Playing) { return message('NOT_PAUSED'); }

    const success = player.audioPlayer.unpause();

    if(success) { return message('RESUMED'); }
    return message('GENERIC_ERROR');
};

