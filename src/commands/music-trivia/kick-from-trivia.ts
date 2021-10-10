import type {User} from 'discord.js';
import {triviaManager} from '../../utils/client';
import type {CommandReturn, CustomInteraction, MessageFunction} from '../../utils/types';

export const name = 'kick-from-trivia';
export const description = 'Kicks a player from the trivia';
export const deferred = false;

export const options = [
    {type: 'user' as const, name: 'player', description: 'Who do you want to kick?', required: true, choices: []},
];

export const execute = async(interaction: CustomInteraction, message: MessageFunction, player: User): Promise<CommandReturn> => {
    if(interaction.user.id !== '530808977794007051') { return 'Only the owner of the bot can do this!'; }
    const triviaPlayer = triviaManager.get(interaction.guildId);
    if(!triviaPlayer) { return 'Trivia is not running right now!'; }
    if(!triviaPlayer.score.has(player.username)) { return 'They\'re not in the trivia!'; }
    triviaPlayer.score.delete(player.username);
    return 'Removed them from the music trivia!';
};
