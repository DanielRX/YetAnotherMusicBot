import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {setupOption} from '../../utils/utils';

export const name = 'random';
export const description = 'Generate a random number between two provided numbers!';

export const options = [
    {name: 'min', description: 'What is the minimum number?', required: true, choices: []},
    {name: 'max', description: 'What is the maximum number?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addIntegerOption(setupOption(options[0])).addIntegerOption(setupOption(options[1]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const min = Math.ceil(Number(interaction.options.get('min')?.value));
    const max = Math.floor(Number(interaction.options.get('max')?.value));
    const rngEmbed = new MessageEmbed().setTitle(`${Math.floor(Math.random() * (max - min + 1)) + min}`);

    return interaction.reply({embeds: [rngEmbed]});
};
