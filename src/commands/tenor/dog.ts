import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';

export const name = 'dog';
export const description = 'Replies with a cute dog picture!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    if(!config.tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }

    fetch(`https://api.tenor.com/v1/random?key=${config.tenorAPI}&q=dog&limit=1`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[0].url))
        .catch(async(err) => {
            await interaction.reply(':x: Request to find a doggo failed!');
            return console.error(err);
        });
};

