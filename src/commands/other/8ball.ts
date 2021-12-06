import type {CommandInput, CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import fs from 'fs-extra';
import {randomEl} from '../../utils/utils';

export const name = '8ball';
export const description = 'Get the answer to anything!';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'question', description: 'What do you want to ask?', required: true, choices: []}
];

const embedColour = '#000000';

export const execute = async({params: {question}}: CommandInput<{question: string}>): Promise<CommandReturn> => {
    if(question.length > 255) { return 'Please ask a shorter question!'; }

    const {answers} = fs.readJSONSync('./resources/other/8ball.json', 'utf8') as {answers: ({text: string})[]};

    const randomAnswer = randomEl(answers);

    const answerEmbed = new MessageEmbed()
        .setTitle(question)
        .setAuthor('Magic 8 Ball', 'https://i.imgur.com/HbwMhWM.png')
        .setDescription(randomAnswer.text)
        .setColor(embedColour)
        .setTimestamp();

    return {embeds: [answerEmbed]};
};

