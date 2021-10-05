import type {CommandReturn, MessageFunction} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'pokimane';
export const description = 'Responds with a random pokimane gif!';
export const deferred = false;

export const execute = async(message: MessageFunction): Promise<CommandReturn> => searchTenor(message, 'pokimane');
