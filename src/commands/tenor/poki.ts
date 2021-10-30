import type {CommandReturn, CommandInput} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'pokimane';
export const description = 'Responds with a random pokimane gif!';
export const deferred = false;

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => searchTenor(messages, 'pokimane');
