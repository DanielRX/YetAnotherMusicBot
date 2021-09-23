// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {setupOption} = require('../../utils/utils');

export const name = 'random';
export const description = 'Generate a random number between two provided numbers!';

export const options = [
    {name: 'min', description: 'What is the minimum number?', required: true, choices: []},
    {name: 'max', description: 'What is the maximum number?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addIntegerOption(setupOption(options[0])).addIntegerOption(setupOption(options[1]));

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    const min = Math.ceil(interaction.options.get('min').value);
    const max = Math.floor(interaction.options.get('max').value);
    const rngEmbed = new MessageEmbed().setTitle(`${Math.floor(Math.random() * (max - min + 1)) + min}`);

    return interaction.reply({embeds: [rngEmbed]});
};


