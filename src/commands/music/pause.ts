import type {CommandReturn, CommandInput} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager} from '../../utils/client';

export const name = 'pause';
export const description = 'Pause the playing track';
export const deferred = false;

export const execute = async({guildId, guild, sender, messages}: CommandInput): Promise<CommandReturn> => {
    const voiceChannel = sender.voice.channel;
    if(!voiceChannel) { return messages.NOT_IN_VC(); }

    const player = playerManager.get(guildId);
    if(!player) { return messages.NO_SONG_PLAYING(); }
    if(voiceChannel.id !== guild.me?.voice.channel?.id) { return messages.NOT_IN_SAME_VC(); }
    if(player.audioPlayer.state.status === AudioPlayerStatus.Paused) { return messages.ALREADY_PAUSED(); }

    const success = player.audioPlayer.pause();

    if(success) { return messages.SUCCESS(); }
    return messages.FAIL();
};
