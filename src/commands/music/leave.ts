// @ts-check
import {SlashCommandBuilder} from '@discordjs/builders';
import {AudioPlayerStatus} from '@discordjs/voice';
import type {CustomInteraction} from '../../utils/types';

export const name = 'leave';
export const description = 'Leaves a voice channel if in one!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) {
        return interaction.reply('Please join a voice channel and try again!');
    }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player?.audioPlayer.state.status !== AudioPlayerStatus.Playing || !player) {
        return interaction.reply('There is no song playing right now!');
    }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) {
        return interaction.reply('You must be in the same voice channel as the bot in order to skip!');
    }

    player.connection.destroy();
    interaction.client.playerManager.delete(interaction.guildId);
    return interaction.reply('Left your voice channel!');
};

