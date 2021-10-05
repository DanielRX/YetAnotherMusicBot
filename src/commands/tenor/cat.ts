import type {CommandReturn, MessageFunction} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'cat';
export const description = 'Replies with a cute cat picture!';
export const deferred = false;

export const execute = async(message: MessageFunction): Promise<CommandReturn> => searchTenor(message, 'cat');
