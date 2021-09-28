import type {CustomInteraction, GuildData} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';
import {guildData, playerManager} from '../../utils/client';

export const name = 'loop-queue';
export const description = 'Loop the queue x times! - (the default is 1 time)';
export const deferred = false;

export const options = [
    {type: 'integer' as const, name: 'looptimes', description: 'How many times do you want to loop the queue?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, loopTimes: number): Promise<string> => {
    if(!guildData.get(interaction.guildId)) {
        guildData.set(interaction.guildId, createGuildData());
    }
    const guild = guildData.get(interaction.guildId) as unknown as GuildData;
    const player = playerManager.get(interaction.guildId);
    if(!player) { return 'There is no song playing now!'; }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return 'There is no song playing now!'; }
    if(guild.triviaData.isTriviaRunning) { return `You can't use this command while a trivia is running!`; } // player.audioPlayer.state.status === AudioPlayerStatus.Playing
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) { return `You must be in the same voice channel as the bot in order to use that!`; }
    if(player.loopSong) { return ':x: Turn off the **loop** command before using the **loopqueue** command'; }

    player.loopTimes = loopTimes;

    if(player.loopQueue) {
        player.loopQueue = false;
        return ':repeat: The queue is no longer playing on **loop**';
    }
    player.loopQueue = true;
    return ':repeat: The queue is now playing on **loop**';
};
