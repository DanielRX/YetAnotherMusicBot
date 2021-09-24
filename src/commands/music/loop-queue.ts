import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';

import {setupOption} from '../../utils/utils';

export const name = 'loop-queue';
export const description = 'Loop the queue x times! - (the default is 1 time)';

export const options = [
    {name: 'looptimes', description: 'How many times do you want to loop the queue?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addIntegerOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!interaction.client.guildData.get(interaction.guildId)) {
        interaction.client.guildData.set(interaction.guildId, createGuildData());
    }
    const guildData = interaction.client.guildData.get(interaction.guildId);
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(!player) {
        return interaction.reply('There is no song playing now!');
    }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        return interaction.reply('There is no song playing now!');
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if(player.audioPlayer.state.status === AudioPlayerStatus.Playing && guildData?.triviaData.isTriviaRunning) {
        return interaction.reply(`You can't use this command while a trivia is running!`);
    }
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) {
        return interaction.reply(`You must be in the same voice channel as the bot in order to use that!`);
    }
    if(player.loopSong) {
        return interaction.reply(':x: Turn off the **loop** command before using the **loopqueue** command');
    }

    const looptimes = (interaction.options.get('looptimes') ?? {value: 1}).value;
    player.loopTimes = looptimes;

    if(player.loopQueue) {
        player.loopQueue = false;
        return interaction.reply(':repeat: The queue is no longer playing on **loop**');
    }
    player.loopQueue = true;
    return interaction.reply(':repeat: The queue is now playing on **loop**');
};

