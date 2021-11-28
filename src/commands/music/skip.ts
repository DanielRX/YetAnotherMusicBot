import type {CommandInput, CommandReturn, GuildData} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager, guildData} from '../../utils/client';

export const name = 'skip';
export const description = 'Skip the currently playing song!';
export const deferred = false;

export const execute = async({sender, guild, guildId, messages}: CommandInput): Promise<CommandReturn> => {
    const voiceChannel = sender.voice.channel;
    if(!voiceChannel) { return messages.NOT_IN_VC(); }

    const player = playerManager.get(guildId);
    const guildD = guildData.get(guildId) as unknown as GuildData;
    if(player?.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return messages.NO_SONG_PLAYING(); }
    if(voiceChannel.id !== guild.me?.voice.channel?.id) { return messages.NOT_IN_SAME_VC(); }
    if(guildD.triviaData.isTriviaRunning) { return messages.SKIP_TRIVIA_INVALID(); }
    player.audioPlayer.stop();
    return messages.SKIPPED_SONG({songName: player.nowPlaying?.name ?? ''});
};

