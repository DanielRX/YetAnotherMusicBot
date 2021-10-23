import {triviaManager} from '../../utils/client';
import type {CommandReturn, CommandInput} from '../../utils/types';

export const name = 'join-trivia';
export const description = 'Join the music trivia!';
export const deferred = true;

export const options = [];

export const execute = async({interaction, guildId, message}: CommandInput): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return message('NOT_IN_VC'); }

    const triviaPlayer = triviaManager.get(guildId);
    if(!triviaPlayer) { return 'Trivia is not running right now!'; }
    if(triviaPlayer.score.has(`d:${interaction.user.username.toLowerCase()}`)) { return 'You\'re already in the trivia!'; }
    triviaPlayer.score.set(`d:${interaction.user.username.toLowerCase()}`, 0);
    return 'Added you to the music trivia!';
};
