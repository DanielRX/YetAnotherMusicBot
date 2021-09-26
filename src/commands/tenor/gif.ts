import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {config} from '../../utils/config';
import {setupOption, fetch} from '../../utils/utils';

export const name = 'gif';
export const description = 'Replies with a gif matching your query!';

export const options = [
    {name: 'gif', description: 'What gif would you like to search for?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    const gif = interaction.options.get('gif')?.value;
    return fetch<{results: ({url: string})[]}>(`https://g.tenor.com/v1/random?key=${config.tenorAPI}&q=${gif}&limit=1`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[0].url))
        .catch(() => {
            // console.error(e); // if you uncomment this, add an 'e' parameter to onError
            return interaction.reply(':x: Failed to find a gif that matched your query!');
        });
};
