import type {CommandReturn, MessageFunction} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'dog';
export const description = 'Replies with a cute dog picture!';
export const deferred = false;

export const execute = async(message: MessageFunction): Promise<CommandReturn> => searchTenor(message, 'dog');

