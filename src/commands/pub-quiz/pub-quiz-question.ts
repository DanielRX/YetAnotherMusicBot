import {MessageEmbed} from 'discord.js';
import {logger} from '../../utils/logging';
import type {CommandReturn, CommandInput} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
const HTMLDecoderEncoder = require('html-encoder-decoder');

export const name = 'pub-quiz-question';
export const description = 'Replies with a pub quiz question!';
export const deferred = false;

const categories = {generalKnowledge: 9, entertainmentBooks: 10, entertainmentFilm: 11, entertainmentMusic: 12, entertainmentMusicalsAndTheatres: 13, entertainmentTelevision: 14, entertainmentVideoGames: 15, entertainmentBoardGames: 16, scienceAbdNature: 17, scienceComputers: 18, scienceMathematics: 19, mythology: 20, sports: 21, geography: 22, history: 23, politics: 24, art: 25, celebrities: 26, animals: 27, vehicles: 28, entertainmentComics: 29, scienceGadgets: 30, entertainmentJapaneseAnimeAndManga: 31, entertainmentCartoonAndAnimations: 32};

const url = 'https://opentdb.com/api.php';
const amount = 1;

export const options = [
    {type: 'string' as const, name: 'difficulty', description: 'The difficulty of the question', required: false, choices: ['easy', 'medium', 'hard', 'all'], default: 'all'},
    {type: 'string' as const, name: 'question-type', description: 'The type of the question', required: false, choices: ['multiple', 'boolean', 'both'], default: 'both'},
    {type: 'integer' as const, name: 'category', description: 'The category of the question', required: false, choices: [], default: 1}
];

export const execute = async({message, interaction, params: {difficulty, questionType, category}}: CommandInput): Promise<CommandReturn> => {
    const t = questionType !== 'both';
    const d = difficulty !== 'all';
    const categoryIn = Number(category) !== 1;
    const fullUrl = `${url}?amount=${amount}${t ? `&type=${questionType}` : ''}${d ? `&difficulty=${difficulty}` : ''}${categoryIn ? `&category=${category}` : ''}`;
    const data = await fetchJSON<{results: any}>(fullUrl).then(({results}) => results);
    const question = HTMLDecoderEncoder.decode(data[0].question);
    const trueFalse = data[0].type === 'boolean';
    let optionsString = '';
    if(!trueFalse) {
        const opts = [data[0].correct_answer, ...data[0].incorrect_answers].map((answer) => HTMLDecoderEncoder.decode(answer));
        optionsString = opts.sort((a, b) => a - b).map((a, i) => `${i + 1}) ${a}`).join('\n');
    }

    const trueFalseAnswers = `1) True\n2) False`;
    const embed = new MessageEmbed()
        .setColor('#403B3A')
        .setAuthor(`Question, ${data[0].difficulty} - ${data[0].category}`, '', 'https://opentdb.com/api.php')
        .setDescription(`${question.replace('&quot;', '"')}\n\n${trueFalse ? trueFalseAnswers : optionsString}`)
        .setTimestamp()
        .setFooter('Powered by opentdb.com', '');

    setTimeout(() => { void (interaction?.channel ?? message?.channel).send(HTMLDecoderEncoder.decode(data[0].correct_answer)); } , 30 * 1000);
    return {embeds: [embed]};
};

