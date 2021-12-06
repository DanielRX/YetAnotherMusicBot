import type {CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {randomEl} from '../../utils/utils';

export const name = 'rps';
export const description = 'Rock paper scissors!';
export const deferred = false;

const choices = ['Rock', 'Paper', 'Scissors'];
export const options = [
    {type: 'string' as const, name: 'move', description: 'You ready for a game of Rock, Paper, Scissors?\nWhat is your move?', required: true, choices}
];

export const execute = async(): Promise<CommandReturn> => {
    const reply = randomEl(choices);

    const embed = new MessageEmbed().setColor('RANDOM').setTitle('Rock, Paper, Scissors').setDescription(`**${reply}**`);
    return {embeds: [embed]};
};

