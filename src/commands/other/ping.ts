import type {CommandReturn, MessageFunction} from '../../utils/types';

export const name = 'ping';
export const description = 'Replies with Pong!';
export const deferred = false;

export const execute = async(message: MessageFunction): Promise<CommandReturn> => {
    return 'Pong!';
};
