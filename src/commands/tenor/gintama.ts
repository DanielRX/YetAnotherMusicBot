import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import fs from 'fs-extra';
import {randomEl} from '../../utils/utils';

export const name = 'gintama';
export const description = 'Replies with a gintama gif!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    try {
        const linkArray = await fs.readFile('./resources/gifs/gintamalinks.txt', 'utf8').then((links) => links.split('\n'));
        const link = randomEl(linkArray);
        return void interaction.reply(link);
    } catch(e) {
        console.error(e);
        return interaction.reply(':x: Failed to fetch a gintama gif!');
    }
};
