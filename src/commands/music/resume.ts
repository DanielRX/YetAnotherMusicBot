import type {CommandInput, CommandReturn} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager} from '../../utils/client';

export const name = 'resume';
export const description = 'Resume a paused track';
export const deferred = false;

export const execute = async({sender, guild, guildId, messages}: CommandInput): Promise<CommandReturn> => {
    const voiceChannel = sender.voice.channel;
    if(!voiceChannel) { return messages.NOT_IN_VC(); }

    const player = playerManager.get(guildId);
    if(!player) { return messages.NO_SONG_PLAYING(); }
    if(voiceChannel.id !== guild.me?.voice.channel?.id) { return messages.NOT_IN_SAME_VC(); }
    if(player.audioPlayer.state.status == AudioPlayerStatus.Playing) { return messages.NOT_PAUSED(); }

    const success = player.audioPlayer.unpause();

    if(success) { return messages.RESUMED(); }
    return messages.GENERIC_ERROR();
};

