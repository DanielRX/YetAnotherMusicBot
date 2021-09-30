import type {CommandReturn} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'cat';
export const description = 'Replies with a cute cat picture!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => searchTenor('cat');
