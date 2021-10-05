import {MessageEmbed} from 'discord.js';
import type {CommandReturn, CustomInteraction, MessageFunction} from '../../utils/types';

export const name = 'random';
export const description = 'Generate a random number between two provided numbers!';
export const deferred = false;

export const options = [
    {type: 'integer' as const, name: 'min', description: 'What is the minimum number?', required: true, choices: []},
    {type: 'integer' as const, name: 'max', description: 'What is the maximum number?', required: true, choices: []}
];

export const execute = async(_: CustomInteraction, message: MessageFunction, minIn: number, maxIn: number): Promise<CommandReturn> => {
    const min = Math.ceil(minIn);
    const max = Math.floor(maxIn);
    const rngEmbed = new MessageEmbed().setTitle(`${Math.floor(Math.random() * (max - min + 1)) + min}`);

    return {embeds: [rngEmbed]};
};
