import type {CommandReturn} from '../../utils/types';
import {randomLineFromFile} from '../../utils/utils';

export const name = 'top-gear';
export const description = 'Replies with a top gear gif/video!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => randomLineFromFile('./resources/media/top-gear.txt');
