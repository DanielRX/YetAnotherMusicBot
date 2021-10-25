import type {CommandReturn} from '../../utils/types';

export const name = 'ping';
export const description = 'Replies with Pong!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => 'Pong!';
