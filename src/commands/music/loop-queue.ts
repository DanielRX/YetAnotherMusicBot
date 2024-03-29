import type {CommandInput, GuildData} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';
import {guildData, playerManager} from '../../utils/client';

export const name = 'loop-queue';
export const description = 'Loop the queue x times! - (the default is 1 time)';
export const deferred = false;

export const options = [
    {type: 'integer' as const, name: 'looptimes', description: 'How many times do you want to loop the queue?', required: true, choices: []}
];

export const execute = async({interaction, messages, params: {loopTimes}}: CommandInput<{loopTimes: number}>): Promise<string> => {
    if(!guildData.get(interaction.guildId)) {
        guildData.set(interaction.guildId, createGuildData());
    }
    const guild = guildData.get(interaction.guildId) as unknown as GuildData;
    const player = playerManager.get(interaction.guildId);
    if(!player) { return messages.NO_SONG_PLAYING(); }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return messages.NO_SONG_PLAYING(); }
    if(guild.triviaData.isTriviaRunning) { return messages.TRIVIA_IS_RUNNING(); } // player.audioPlayer.state.status === AudioPlayerStatus.Playing
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) { return messages.NOT_IN_SAME_VC(); }
    if(player.loopSong) { return messages.LOOP_SONG_ON(); }

    player.loopTimes = loopTimes;

    if(player.loopQueue) {
        player.loopQueue = false;
        return messages.LOOP_DISABLED();
    }
    player.loopQueue = true;
    return messages.LOOP_ENABLED();
};
