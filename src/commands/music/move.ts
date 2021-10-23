import type {CommandInput, GuildData} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';
import {arrayMove} from '../../utils/utils';
import {guildData, playerManager} from '../../utils/client';

export const name = 'move';
export const description = 'Move a song to a desired position in queue!';
export const deferred = false;

export const options = [
    {type: 'integer' as const, name: 'oldposition', description: 'What is the position of the song you want to move?', required: true, choices: []},
    {type: 'integer' as const, name: 'newposition', description: 'What position do you want to move the song to?', required: true, choices: []}
];

export const execute = async({interaction, guildId, message, params: {oldPosition, newPosition}}: CommandInput<{oldPosition: number, newPosition: number}>): Promise<string> => {
    if(!guildData.get(guildId)) {
        guildData.set(guildId, createGuildData());
    }
    const guild = guildData.get(guildId) as unknown as GuildData;
    const player = playerManager.get(guildId);
    if(!player) { return message('NO_SONG_PLAYING'); }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return message('NO_SONG_PLAYING'); }
    if(guild.triviaData.isTriviaRunning) { return message('TRIVIA_IS_RUNNING'); } // && player.audioPlayer.state.status === AudioPlayerStatus.Playing
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) { return message('NOT_IN_SAME_VC'); }
    const invalidPosition = oldPosition < 1 || oldPosition > player.queue.length || newPosition < 1 || newPosition > player.queue.length || oldPosition == newPosition;
    if(invalidPosition) { return message('INVALID_POSITION'); }

    const songName = player.queue[oldPosition - 1].name;
    arrayMove(player.queue, oldPosition - 1, newPosition - 1);

    return message('SONG_MOVED', {songName, newPosition});
};
