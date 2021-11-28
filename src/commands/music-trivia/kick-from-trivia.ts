import type {User} from 'discord.js';
import {triviaManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'kick-from-trivia';
export const description = 'Kicks a player from the trivia';
export const deferred = false;

export const options = [
    {type: 'user' as const, name: 'player', description: 'Who do you want to kick?', required: true, choices: []},
];

const ownerId = '530808977794007051';

export const execute = async({sender, guildId, params: {player}, messages}: CommandInput<{player: User}>): Promise<CommandReturn> => {
    if(sender.user.id !== ownerId) { return messages.ONLY_OWNER(); }
    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return messages.TRIVIA_NOT_RUNNING(); }
    if(!triviaPlayer.score.has(`d:${player.username.toLowerCase()}`)) { return messages.NOT_IN_TRIVIA(); }
    triviaPlayer.score.delete(`d:${player.username.toLowerCase()}`);
    return messages.REMOVED_FROM_TRIVIA();
};
