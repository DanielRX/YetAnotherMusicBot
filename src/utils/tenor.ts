import type {CommandReturn} from './types';
import {config} from './config';
import {fetch} from './utils';
import {logger} from './logging';
import type {LocaleObj} from './messages';

export const searchTenor = async(messages: LocaleObj, gif: string): Promise<CommandReturn> => {
    if(!config.tenorAPI) { return ':x: Tenor commands are not enabled'; }
    return fetch<{results: ({url: string})[]}>(`https://g.tenor.com/v1/random?key=${config.tenorAPI}&q=${gif}&limit=1`)
        .then(async(res) => res.json())
        .then(async(json) => json.results[0].url)
        .catch(async(e: unknown) => {
            logger.error(e);
            return ':x: Failed to find a gif that matched your query!';
        });
};
