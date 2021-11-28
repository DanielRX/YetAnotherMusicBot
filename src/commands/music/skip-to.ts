import {playerManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'skip-to';
export const description = 'Skip to a song in queue';
export const deferred = true;

export const options = [
    {type: 'integer' as const, name: 'position', description: 'What is the position in queue you want to skip to?', required: true, choices: []},
];

export const execute = async({sender, guildId, guild, params: {position}, messages}: CommandInput<{position: number}>): Promise<CommandReturn> => {
    const voiceChannel = sender.voice.channel;

    if(!voiceChannel) { return messages.NOT_IN_VC(); }
    if(voiceChannel.id !== guild.me?.voice.channel?.id) { return messages.NOT_IN_SAME_VC(); }
    const player = playerManager.get(guildId);
    if(!player) { return messages.NOTHING_PLAYING(); }
    if(player.queue.length < 1) { return messages.NO_SONGS(); }

    if(player.loopQueue) {
        const slicedBefore = player.queue.slice(0, position - 1);
        const slicedAfter = player.queue.slice(position - 1);
        player.queue = slicedAfter.concat(slicedBefore);
    } else {
        player.queue.splice(0, position - 1);
        player.loopSong = false;
    }
    player.audioPlayer.stop();
    return messages.SKIPPED_TO({songName: player.queue[0].name});
};

