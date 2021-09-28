import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';
import {logger} from '../../utils/logging';

export const name = 'cat';
export const description = 'Replies with a cute cat picture!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    if(!config.tenorAPI) { return ':x: Tenor commands are not enabled'; }

    return fetch<{results: ({url: string})[]}>(`https://api.tenor.com/v1/random?key=${config.tenorAPI}&q=cat&limit=1`)
        .then(async(res) => res.json())
        .then(async(json) => json.results[0].url)
        .catch(async(e: unknown) => {
            logger.error(e);
            return ':x: Request to find a kitty failed!';
        });
};
