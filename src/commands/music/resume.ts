import type {CommandReturn, CustomInteraction, MessageFunction} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager} from '../../utils/client';

export const name = 'resume';
export const description = 'Resume a paused track';
export const deferred = false;

export const execute = async(interaction: CustomInteraction, message: MessageFunction): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return 'Please join a voice channel and try again!'; }

    const player = playerManager.get(interaction.guildId);
    if(!player) { return 'There is no song playing right now!'; }
    if(player.audioPlayer.state.status == AudioPlayerStatus.Playing) { return 'This song is not paused!'; }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return 'You must be in the same voice channel as the bot in order to resume!'; }

    const success = player.audioPlayer.unpause();

    if(success) { return ':play_pause: Track resumed!'; }
    return 'I was unable to unpause this song, please try again soon';
};

