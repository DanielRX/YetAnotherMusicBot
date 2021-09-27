import type {CustomInteraction, GuildData} from '../../utils/types';
import {AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';
import {arrayMove} from '../../utils/utils';

export const name = 'move';
export const description = 'Move a song to a desired position in queue!';

export const options = [
    {type: 'integer' as const, name: 'oldposition', description: 'What is the position of the song you want to move?', required: true, choices: []},
    {type: 'integer' as const, name: 'newposition', description: 'What position do you want to move the song to?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!interaction.client.guildData.get(interaction.guildId)) {
        interaction.client.guildData.set(interaction.guildId, createGuildData());
    }
    const guildData = interaction.client.guildData.get(interaction.guildId) as unknown as GuildData;
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(!player) {
        return interaction.reply('There is no song playing now!');
    }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        return interaction.reply('There is no song playing now!');
    }
    if(guildData.triviaData.isTriviaRunning) { // && player.audioPlayer.state.status === AudioPlayerStatus.Playing
        return interaction.reply(`You can't use this command while a trivia is running!`);
    }
    if(interaction.member.voice.channelId !== interaction.guild.me?.voice.channelId) {
        return interaction.reply(`You must be in the same voice channel as the bot in order to use that!`);
    }
    const oldPosition = Number(interaction.options.get('oldposition')?.value);
    const newPosition = Number(interaction.options.get('newposition')?.value);

    if(oldPosition < 1 || oldPosition > player.queue.length || newPosition < 1 || newPosition > player.queue.length || oldPosition == newPosition) {
        return interaction.reply(':x: Try again and enter a valid song position number');
    }

    const songName = player.queue[oldPosition - 1].name;
    arrayMove(player.queue, oldPosition - 1, newPosition - 1);

    return interaction.reply(`**${songName}** moved to position ${newPosition}`);
};
