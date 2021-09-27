import type {CustomInteraction, GuildData} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';

export const name = 'loop';
export const description = 'Set a song to play on loop';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!interaction.client.guildData.get(interaction.guildId)) {
        interaction.client.guildData.set(interaction.guildId, createGuildData());
    }
    const guildData = interaction.client.guildData.get(interaction.guildId) as unknown as GuildData;
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(!player) {
        return interaction.reply('There is no song playing now!');
    }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return interaction.reply('There is no song playing now!'); }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if(player.audioPlayer.state.status === AudioPlayerStatus.Playing && guildData.triviaData.isTriviaRunning) {
        return interaction.reply(`You can't use this command while a trivia is running!`);
    }
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) {
        return interaction.reply(`You must be in the same voice channel as the bot in order to use that!`);
    }

    if(player.loopSong) {
        player.loopSong = false;
        return interaction.reply(`**${player.nowPlaying?.name}** is no longer playing on repeat :repeat: `);
    }

    player.loopSong = true;
    return interaction.reply(`**${player.nowPlaying?.name}** is now playing on repeat :repeat: `);
};

