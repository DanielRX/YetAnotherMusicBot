import {triviaManager} from '../../utils/client';
import type {CustomInteraction, CommandReturn, MessageFunction} from '../../utils/types';

export const name = 'join-trivia';
export const description = 'Join the music trivia!';
export const deferred = true;

export const options = [];

export const execute = async(interaction: CustomInteraction, message: MessageFunction): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return message('NOT_IN_VC'); }

    const triviaPlayer = triviaManager.get(interaction.guildId);
    if(!triviaPlayer) { return 'Trivia is not running right now!'; }
    if(triviaPlayer.score.has(interaction.user.username)) { return 'You\'re already in the trivia!'; }
    triviaPlayer.score.set(interaction.user.username, 0);
    return 'Added you to the music trivia!';
};
