import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import fs from 'fs-extra';

export const name = '8ball';
export const description = 'Get the answer to anything!';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'question', description: 'What do you want to ask?', required: true, choices: []}
];

export const execute = async(_: CustomInteraction, question: string): Promise<CommandReturn> => {
    if(question.length > 255) { return 'Please ask a shorter question!'; }

    const {answers} = fs.readJSONSync('././resources/other/8ball.json', 'utf8') as {answers: ({text: string})[]};

    const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

    const answerEmbed = new MessageEmbed()
        .setTitle(question)
        .setAuthor('Magic 8 Ball', 'https://i.imgur.com/HbwMhWM.png')
        .setDescription(randomAnswer.text)
        .setColor('#000000')
        .setTimestamp();

    return {embeds: [answerEmbed]};
};

