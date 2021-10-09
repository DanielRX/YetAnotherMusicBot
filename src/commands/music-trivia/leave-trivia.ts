import {triviaManager} from '../../utils/client';
import type {CustomInteraction, CommandReturn, MessageFunction} from '../../utils/types';

export const name = 'leave-trivia';
export const description = 'Leave the music trivia!';
export const deferred = true;

export const options = [];

export const execute = async(interaction: CustomInteraction, message: MessageFunction): Promise<CommandReturn> => {
    const triviaPlayer = triviaManager.get(interaction.guildId);
    if(!triviaPlayer) { return 'Trivia is not running right now!'; }
    if(triviaPlayer.score.has(interaction.user.username)) { return 'You\'re not in the trivia!'; }
    triviaPlayer.score.delete(interaction.user.username);
    return 'Removed you from the music trivia!';
};
