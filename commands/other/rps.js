// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {setupOption} = require('../../utils/utils');

const name = 'rps';
const description = 'Rock paper scissors!';

const options = [
    {name: 'move', description: 'You ready for a game of Rock, Paper, Scissors? \n What is your move?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
     * @param {import('../../').CustomInteraction} interaction
     * @returns {Promise<void>}
     */
const execute = async(interaction) => {
    const replies = ['Rock', 'Paper', 'Scissors'];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setTitle('Rock, Paper, Scissors')
        .setDescription(`**${reply}**`);
    return interaction.reply({embeds: [embed]});
};

module.exports = {data, execute};
