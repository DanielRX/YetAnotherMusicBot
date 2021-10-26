import type {CommandReturn} from '../../utils/types';
import {randomLineFromFile} from '../../utils/utils';

export const name = 'gintama';
export const description = 'Replies with a gintama gif!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => randomLineFromFile('./resources/media/gintamalinks.txt');
