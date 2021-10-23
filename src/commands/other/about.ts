import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'about';
export const description = 'Info about the bot and its creator!';
export const deferred = false;

export const execute = async({message}: CommandInput): Promise<CommandReturn> => {
    return message('ABOUT');
};
