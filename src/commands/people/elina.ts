import type {CommandReturn} from '../../utils/types';
import fs from 'fs-extra';
import {randomEl} from '../../utils/utils';

export const name = 'elina';
export const description = 'Replies with an elina gif/video!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    const linkArray = await fs.readFile('./resources/media/elina.txt', 'utf8').then((links) => links.split('\n'));
    const link = randomEl(linkArray);
    return link;
};
