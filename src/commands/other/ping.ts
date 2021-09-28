import type {CommandReturn, CustomInteraction} from '../../utils/types';

export const name = 'ping';
export const description = 'Replies with Pong!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    return 'Pong!';
};
