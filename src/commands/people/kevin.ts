import type {CommandReturn} from '../../utils/types';
import {randomLineFromFile} from '../../utils/utils';

export const name = 'kevin';
export const description = 'Replies with an kevin gif/video!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => randomLineFromFile('./resources/media/kevin.txt');
