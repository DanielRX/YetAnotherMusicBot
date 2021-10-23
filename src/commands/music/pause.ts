import type {CommandReturn, CommandInput} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager} from '../../utils/client';

export const name = 'pause';
export const description = 'Pause the playing track';
export const deferred = false;

export const execute = async({interaction, message}: CommandInput): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return message('NOT_IN_VC'); }

    const player = playerManager.get(interaction.guildId);
    if(!player) { return message('NO_SONG_PLAYING'); }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return message('NOT_IN_SAME_VC'); }
    if(player.audioPlayer.state.status === AudioPlayerStatus.Paused) { return message('ALREADY_PAUSED'); }

    const success = player.audioPlayer.pause();

    if(success) { return message('SUCCESS'); }
    return message('FAIL');
};
