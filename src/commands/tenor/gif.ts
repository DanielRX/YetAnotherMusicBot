import type {CustomInteraction} from '../../utils/types';
import {config} from '../../utils/config';
import {fetch} from '../../utils/utils';
import {logger} from '../../utils/logging';

export const name = 'gif';
export const description = 'Replies with a gif matching your query!';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'gif', description: 'What gif would you like to search for?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, gif: string): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    return fetch<{results: ({url: string})[]}>(`https://g.tenor.com/v1/random?key=${config.tenorAPI}&q=${gif}&limit=1`)
        .then(async(res) => res.json())
        .then(async(json) => interaction.reply(json.results[0].url))
        .catch(async(e: unknown) => {
            logger.error(e);
            return interaction.reply(':x: Failed to find a gif that matched your query!');
        });
};
