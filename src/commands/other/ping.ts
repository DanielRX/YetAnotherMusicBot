import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';

export const name = 'ping';
export const description = 'Replies with Pong!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    return interaction.reply('Pong!');
};
