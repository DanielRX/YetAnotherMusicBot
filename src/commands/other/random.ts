import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';

export const name = 'random';
export const description = 'Generate a random number between two provided numbers!';

export const options = [
    {type: 'integer' as const, name: 'min', description: 'What is the minimum number?', required: true, choices: []},
    {type: 'integer' as const, name: 'max', description: 'What is the maximum number?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, minIn: number, maxIn: number): Promise<void> => {
    const min = Math.ceil(minIn);
    const max = Math.floor(maxIn);
    const rngEmbed = new MessageEmbed().setTitle(`${Math.floor(Math.random() * (max - min + 1)) + min}`);

    return interaction.reply({embeds: [rngEmbed]});
};
