import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import fs from 'fs';
import {setupOption} from '../../utils/utils';

export const name = '8ball';
export const description = 'Get the answer to anything!';

export const options = [
    {name: 'question', description: 'What do you want to ask?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const question = interaction.options.get('question')?.value;

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

