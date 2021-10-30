import type {CommandInput, CommandReturn} from '../../utils/types';
import {searchTenor} from '../../utils/tenor';

export const name = 'gif';
export const description = 'Replies with a gif matching your query!';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'gif', description: 'What gif would you like to search for?', required: true, choices: []}
];

export const execute = async({messages, params: {gif}}: CommandInput<{gif: string}>): Promise<CommandReturn> => searchTenor(messages, gif);
