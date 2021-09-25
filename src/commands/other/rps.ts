import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import {setupOption} from '../../utils/utils';

export const name = 'rps';
export const description = 'Rock paper scissors!';

export const options = [
    {name: 'move', description: 'You ready for a game of Rock, Paper, Scissors? \n What is your move?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const replies = ['Rock', 'Paper', 'Scissors'];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setTitle('Rock, Paper, Scissors')
        .setDescription(`**${reply}**`);
    return interaction.reply({embeds: [embed]});
};
