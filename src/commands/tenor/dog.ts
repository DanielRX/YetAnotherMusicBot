import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';

export const name = 'dog';
export const description = 'Replies with a cute dog picture!';

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }

    fetch<{results: ({url: string})[]}>(`https://api.tenor.com/v1/random?key=${config.tenorAPI}&q=dog&limit=1`)
        .then(async(res) => res.json())
        .then(async(json) => interaction.reply(json.results[0].url))
        .catch(async(e: unknown) => {
            console.error(e);
            return interaction.reply(':x: Request to find a doggo failed!');
        });
};

