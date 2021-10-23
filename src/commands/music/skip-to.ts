import {playerManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'skip-to';
export const description = 'Skip to a song in queue';
export const deferred = true;

export const options = [
    {type: 'integer' as const, name: 'position', description: 'What is the position in queue you want to skip to?', required: true, choices: []},
];

export const execute = async({interaction, guildId, params: {position}}: CommandInput<{position: number}>): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return `:no_entry: You must be in the same voice channel as the bot in order to use that!`; }
    if(voiceChannel.id !== interaction.member.voice.channelId) { return `:no_entry: You must be in the same voice channel as the bot in order to use that!`; }
    const player = playerManager.get(guildId);
    if(!player) { return ':x: There is nothing playing right now!'; }
    if(player.queue.length < 1) { return 'There are no songs in queue!'; }

    if(player.loopQueue) {
        const slicedBefore = player.queue.slice(0, position - 1);
        const slicedAfter = player.queue.slice(position - 1);
        player.queue = slicedAfter.concat(slicedBefore);
    } else {
        player.queue.splice(0, position - 1);
        player.loopSong = false;
    }
    player.audioPlayer.stop();
    return `Skipped to **${player.queue[0].name}**`;
};

