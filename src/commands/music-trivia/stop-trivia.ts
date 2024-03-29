import {triviaManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'stop-trivia';
export const description = 'End a music trivia (if one is in play)';
export const deferred = false;

export const execute = async({interaction, guildId}: CommandInput): Promise<CommandReturn> => {
    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return ':x: No trivia is currently running!'; }

    if(interaction.guild.me?.voice.channel !== interaction.member.voice.channel) { return ':no_entry: Please join a voice channel and try again!'; }

    if(!triviaPlayer.score.has(`d:${interaction.user.username.toLowerCase()}`)) { return ':stop_sign: You need to participate in the trivia in order to end it'; }
    triviaPlayer.reset();
    triviaManager.delete(guildId);

    return 'Stopped the trivia! To start a new one, use the music-trivia command';
};
