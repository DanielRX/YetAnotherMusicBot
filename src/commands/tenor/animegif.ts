//@ts-check
import {SlashCommandBuilder} from '@discordjs/builders';
import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';
import type {CustomInteraction} from '../../utils/types';

export const name = 'animegif';
export const description = 'Responds with a random anime gif';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    void fetch(`https://g.tenor.com/v1/random?key=${config.tenorAPI}&q=anime&limit=50`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[Math.floor(Math.random() * 49)].url))
        .catch(() => {
            return interaction.reply(':x: Failed to find a gif!');
        });
};

