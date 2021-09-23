// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {setupOption} = require('../../utils/utils');

export const name = 'rps';
export const description = 'Rock paper scissors!';

export const options = [
    {name: 'move', description: 'You ready for a game of Rock, Paper, Scissors? \n What is your move?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
     * @param {import('../../').CustomInteraction} interaction
     * @returns {Promise<void>}
     */
export const executeexecuteexecute = async(interaction) => {
    const replies = ['Rock', 'Paper', 'Scissors'];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setTitle('Rock, Paper, Scissors')
        .setDescription(`**${reply}**`);
    return interaction.reply({embeds: [embed]});
};


