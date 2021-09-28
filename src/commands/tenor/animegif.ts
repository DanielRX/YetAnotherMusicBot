import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';
import type {CustomInteraction} from '../../utils/types';
import {logger} from '../../utils/logging';

export const name = 'animegif';
export const description = 'Responds with a random anime gif';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    return fetch<{results: ({url: string})[]}>(`https://g.tenor.com/v1/random?key=${config.tenorAPI}&q=anime&limit=50`)
        .then(async(res) => res.json())
        .then(async(json) => interaction.reply(json.results[Math.floor(Math.random() * 49)].url))
        .catch(async(e: unknown) => {
            logger.error(e);
            return interaction.reply(':x: Failed to find a gif!');
        });
};

