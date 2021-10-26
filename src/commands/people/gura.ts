import type {CommandReturn} from '../../utils/types';
import {randomLineFromFile} from '../../utils/utils';

export const name = 'gura';
export const description = 'Replies with an gura gif/video!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => randomLineFromFile('./resources/media/gura.txt');
