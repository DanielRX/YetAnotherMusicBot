// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const fs = require('fs');

const {setupOption} = require('../../utils/utils');

const name = 'create-playlist';
const description = 'Get the answer to anything!';

const options = [
    {name: 'question', description: 'What do you want to ask?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    const question = interaction.options.get('question').value;

    if(question.length > 255) {
        return interaction.reply('Please ask a shorter question!');
    }

    const ballAnswers = fs.readFileSync('././resources/other/8ball.json', 'utf8');
    const ballArray = JSON.parse(ballAnswers).answers;

    const randomAnswer = ballArray[Math.floor(Math.random() * ballArray.length)];

    const answerEmbed = new MessageEmbed()
        .setTitle(question)
        .setAuthor('Magic 8 Ball', 'https://i.imgur.com/HbwMhWM.png')
        .setDescription(randomAnswer.text)
        .setColor('#000000')
        .setTimestamp();

    return interaction.reply({embeds: [answerEmbed]});
};

module.exports = {data, execute};

