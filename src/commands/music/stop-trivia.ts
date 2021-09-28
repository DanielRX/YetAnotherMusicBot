import {triviaManager} from '../../utils/client';
import type {CustomInteraction} from '../../utils/types';

export const name = 'stop-trivia';
export const description = 'End a music trivia (if one is in play)';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const triviaPlayer = triviaManager.get(interaction.guildId);
    if(!triviaPlayer) {
        return interaction.reply(':x: No trivia is currently running!');
    }

    if(interaction.guild.me?.voice.channel !== interaction.member.voice.channel) {
        return interaction.reply(':no_entry: Please join a voice channel and try again!');
    }

    if(!triviaPlayer.score.has(interaction.member.user.username)) {
        return interaction.reply(':stop_sign: You need to participate in the trivia in order to end it');
    }
    triviaPlayer.reset();
    triviaManager.delete(interaction.guildId);

    return interaction.reply('Stopped the trivia! To start a new one, use the music-trivia command');
};
