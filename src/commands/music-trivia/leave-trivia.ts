import {triviaManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'leave-trivia';
export const description = 'Leave the music trivia!';
export const deferred = true;

export const options = [];

export const execute = async({interaction, guildId}: CommandInput): Promise<CommandReturn> => {
    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return 'Trivia is not running right now!'; }
    if(!triviaPlayer.score.has(`d:${interaction.user.username.toLowerCase()}`)) { return 'You\'re not in the trivia!'; }
    triviaPlayer.score.delete(`d:${interaction.user.username.toLowerCase()}`);
    return 'Removed you from the music trivia!';
};
