import {playerManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';
import {shuffleArray} from '../../utils/utils';

export const name = 'shuffle';
export const description = 'Shuffle the music queue!';
export const deferred = true;

export const execute = async({guildId, guild, sender, messages}: CommandInput): Promise<CommandReturn> => {
    const voiceChannel = sender.voice.channel;
    if(!voiceChannel) { return messages.NOT_IN_VC(); }
    if(voiceChannel.id !== guild.me?.voice.channel?.id) { return messages.NOT_IN_SAME_VC(); }
    const player = playerManager.get(guildId);
    if(!player) { return messages.NOTHING_PLAYING(); }
    if(player.loopSong) { return messages.TURN_OFF_LOOP(); }
    if(player.queue.length < 1) { return messages.NO_SONGS(); }
    if(player.commandLock) { return messages.PLAY_CALL_RUNNING(); }

    shuffleArray(player.queue);

    return messages.SHUFFLED();
};

