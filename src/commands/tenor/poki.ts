import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';

export const name = 'pokimane';
export const description = 'Responds with a random pokimane gif!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    return fetch<{results: ({url: string})[]}>(`https://g.tenor.com/v1/random?key=${config.tenorAPI}&q=pokimane&limit=50`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[Math.floor(Math.random() * 49)].url))
        .catch(() => interaction.reply(':x: Failed to find a gif!'));
};
