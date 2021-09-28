import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import {playerManager} from '../../utils/client';

export const name = 'pause';
export const description = 'Pause the playing track';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return 'Please join a voice channel and try again!'; }

    const player = playerManager.get(interaction.guildId);
    if(!player) { return 'There is no song playing right now!'; }
    if(player.audioPlayer.state.status === AudioPlayerStatus.Paused) { return 'You already paused this song!'; }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return 'You must be in the same voice channel as the bot in order to pause!'; }

    const success = player.audioPlayer.pause();

    if(success) { return ':pause_button: Song was paused! To unpause, use the resume command'; }
    return 'I was unable to pause this song, please try again soon';
};
