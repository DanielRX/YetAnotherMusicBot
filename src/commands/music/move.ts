import type {CustomInteraction, GuildData} from '../../utils/types';
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

export const execute = async(interaction: CustomInteraction, oldPosition: number, newPosition: number): Promise<string> => {
    if(!guildData.get(interaction.guildId)) {
        guildData.set(interaction.guildId, createGuildData());
    }
    const guild = guildData.get(interaction.guildId) as unknown as GuildData;
    const player = playerManager.get(interaction.guildId);
    if(!player) { return 'There is no song playing now!'; }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return 'There is no song playing now!'; }
    if(guild.triviaData.isTriviaRunning) { return `You can't use this command while a trivia is running!`; } // && player.audioPlayer.state.status === AudioPlayerStatus.Playing
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) { return `You must be in the same voice channel as the bot in order to use that!`; }
    if(oldPosition < 1 || oldPosition > player.queue.length || newPosition < 1 || newPosition > player.queue.length || oldPosition == newPosition) { return ':x: Try again and enter a valid song position number'; }

    const songName = player.queue[oldPosition - 1].name;
    arrayMove(player.queue, oldPosition - 1, newPosition - 1);

    return `**${songName}** moved to position ${newPosition}`;
};
