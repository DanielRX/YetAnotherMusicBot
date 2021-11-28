import {triviaManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'leave-trivia';
export const description = 'Leave the music trivia!';
export const deferred = true;

export const options = [];

export const execute = async({sender, guildId, messages}: CommandInput): Promise<CommandReturn> => {
    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return messages.TRIVIA_NOT_RUNNING(); }
    if(!triviaPlayer.score.has(`d:${sender.user.username.toLowerCase()}`)) { return messages.NOT_IN_TRIVIA2(); }
    triviaPlayer.score.delete(`d:${sender.user.username.toLowerCase()}`);
    return messages.REMOVED_FROM_TRIVIA();
};
