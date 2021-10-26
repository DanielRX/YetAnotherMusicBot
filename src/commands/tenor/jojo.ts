import type {CommandReturn} from '../../utils/types';
import {randomLineFromFile} from '../../utils/utils';

export const name = 'jojo';
export const description = 'Replies with a random jojo gif!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => randomLineFromFile('./resources/media/jojolinks.txt');
