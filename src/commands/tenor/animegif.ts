import type {CommandInput, CommandReturn} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'animegif';
export const description = 'Responds with a random anime gif';
export const deferred = false;

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => searchTenor(messages, 'anime');

