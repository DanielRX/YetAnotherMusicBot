import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';
import {logger} from '../../utils/logging';

export const name = 'cat';
export const description = 'Replies with a cute cat picture!';

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }

    return fetch<{results: ({url: string})[]}>(`https://api.tenor.com/v1/random?key=${config.tenorAPI}&q=cat&limit=1`)
        .then(async(res) => res.json())
        .then(async(json) => interaction.reply({content: json.results[0].url}))
        .catch(async(e: unknown) => {
            logger.error(e);
            return interaction.reply(':x: Request to find a kitty failed!');
        });
};
