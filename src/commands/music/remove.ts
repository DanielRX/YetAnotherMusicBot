import type {CommandInput, CommandReturn} from '../../utils/types';
import {playerManager} from '../../utils/client';

export const name = 'remove';
export const description = 'Remove a specific song from queue';
export const deferred = false;

export const options = [
    {type: 'integer' as const, name: 'position', description: 'What song number do you want to remove from queue?', required: true, choices: []}
];

export const execute = async({sender, guild, guildId, messages, params: {position}}: CommandInput<{position: number}>): Promise<CommandReturn> => {
    const player = playerManager.get(guildId);

    if(!player) { return messages.NO_SONG_PLAYING(); }

    const voiceChannel = sender.voice.channel;

    if(!voiceChannel) { return messages.NOT_IN_VC(); }
    if(voiceChannel.id !== guild.me?.voice.channel?.id) { return messages.NOT_IN_SAME_VC(); }

    if(position < 1 || position > player.queue.length) { return messages.INVALID_INDEX(); }

    player.queue.splice(position - 1, 1);
    return messages.REMOVED({position});
};
