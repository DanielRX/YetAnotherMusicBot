import type {CommandReturn} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'dog';
export const description = 'Replies with a cute dog picture!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => searchTenor('dog');

