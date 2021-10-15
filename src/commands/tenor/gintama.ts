import type {CommandReturn} from '../../utils/types';
import fs from 'fs-extra';
import {randomEl} from '../../utils/utils';

export const name = 'gintama';
export const description = 'Replies with a gintama gif!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    const linkArray = await fs.readFile('./resources/media/gintamalinks.txt', 'utf8').then((links) => links.split('\n'));
    const link = randomEl(linkArray);
    return link;
};
