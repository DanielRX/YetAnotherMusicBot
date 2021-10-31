import { logger } from '../../utils/logging';
import type {CommandReturn, CommandInput} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';

export const name = 'pub-quiz-question';
export const description = 'Replies with a pub quiz question!';
export const deferred = false;

const categories = {generalKnowledge: 9, entertainmentBooks: 10, entertainmentFilm: 11, entertainmentMusic: 12, entertainmentMusicalsAndTheatres: 13, entertainmentTelevision: 14, entertainmentVideoGames: 15, entertainmentBoardGames: 16, scienceAbdNature: 17, scienceComputers: 18, scienceMathematics: 19, mythology: 20, sports: 21, geography: 22, history: 23, politics: 24, art: 25, celebrities: 26, animals: 27, vehicles: 28, entertainmentComics: 29, scienceGadgets: 30, entertainmentJapaneseAnimeAndManga: 31, entertainmentCartoonAndAnimations: 32};

const url = 'https://opentdb.com/api.php';
const amount = 1;

export const options = [
    {type: 'string' as const, name: 'difficulty', description: 'The difficulty of the question', required: false, choices: ['easy', 'medium', 'hard', 'all'], default: 'all'},
    {type: 'string' as const, name: 'question-type', description: 'The type of the question', required: false, choices: ['multiple', 'boolean', 'both'], default: 'both'}
];

export const execute = async({messages, params: {difficulty, questionType}}: CommandInput): Promise<CommandReturn> => {
    const t = questionType !== 'both';
    const d = difficulty !== 'all';
    const fullUrl = `${url}?amount=${amount}${t ? `&type=${questionType}` : ''}${d ? `&difficulty=${difficulty}` : ''}`;
    const data = await fetchJSON(fullUrl);
    logger.info(data);
    return 'Testing';
};

