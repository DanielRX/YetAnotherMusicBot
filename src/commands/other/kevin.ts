import type {CommandReturn} from '../../utils/types';
import fs from 'fs-extra';
import {randomEl} from '../../utils/utils';

export const name = 'kevin';
export const description = 'Replies with an kevin gif/video!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    const linkArray = await fs.readFile('./resources/media/kevin.txt', 'utf8').then((links) => links.split('\n'));
    const link = randomEl(linkArray);
    return link;
};
