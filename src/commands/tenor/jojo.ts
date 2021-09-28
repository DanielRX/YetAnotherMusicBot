import type {CustomInteraction} from '../../utils/types';
import fs from 'fs-extra';
import {randomEl} from '../../utils/utils';
import {logger} from '../../utils/logging';

export const name = 'jojo';
export const description = 'Replies with a random jojo gif!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    try {
        const linkArray = await fs.readFile('./resources/gifs/jojolinks.txt', 'utf8').then((links) => links.split('\n'));
        const link = randomEl(linkArray);
        return void interaction.reply(link);
    } catch(e: unknown) {
        logger.error(e);
        return interaction.reply(':x: Failed to fetch a gif!');
    }
};
