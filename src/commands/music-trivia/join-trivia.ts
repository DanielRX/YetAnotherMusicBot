import {triviaManager} from '../../utils/client';
import type {CommandReturn, CommandInput} from '../../utils/types';

export const name = 'join-trivia';
export const description = 'Join the music trivia!';
export const deferred = true;

export const options = [];

export const execute = async({sender, guildId, messages}: CommandInput): Promise<CommandReturn> => {
    const voiceChannel = sender.voice.channel;
    if(!voiceChannel) { return messages.NOT_IN_VC(); }

    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return messages.TRIVIA_NOT_RUNNING(); }
    if(triviaPlayer.score.has(`d:${sender.user.username.toLowerCase()}`)) { return messages.ALREADY_IN_TRIVIA(); }
    triviaPlayer.score.set(`d:${sender.user.username.toLowerCase()}`, 0);
    return messages.ADDED_TO_TRIVIA();
};
