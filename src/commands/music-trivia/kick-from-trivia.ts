import type {User} from 'discord.js';
import {triviaManager} from '../../utils/client';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'kick-from-trivia';
export const description = 'Kicks a player from the trivia';
export const deferred = false;

export const options = [
    {type: 'user' as const, name: 'player', description: 'Who do you want to kick?', required: true, choices: []},
];

export const execute = async({interaction, guildId, params: {player}}: CommandInput<{player: User}>): Promise<CommandReturn> => {
    if(interaction.user.id !== '530808977794007051') { return 'Only the owner of the bot can do this!'; }
    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return 'Trivia is not running right now!'; }
    if(!triviaPlayer.score.has(`d:${player.username.toLowerCase()}`)) { return 'They\'re not in the trivia!'; }
    triviaPlayer.score.delete(`d:${player.username.toLowerCase()}`);
    return 'Removed them from the music trivia!';
};
