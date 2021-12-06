import {triviaManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'stop-trivia';
export const description = 'End a music trivia (if one is in play)';
export const deferred = false;

export const execute = async({sender, guild, guildId, messages}: CommandInput): Promise<CommandReturn> => {
    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return messages.TRIVIA_NOT_RUNNING(); }
    if(guild.me?.voice.channel !== sender.voice.channel) { return messages.NOT_IN_VC(); }

    if(!triviaPlayer.score.has(`d:${sender.user.username.toLowerCase()}`)) { return messages.NOT_IN_TRIVIA2(); }
    triviaPlayer.reset();
    triviaManager.delete(guildId);

    return messages.STOPPED_TRIVIA();
};
