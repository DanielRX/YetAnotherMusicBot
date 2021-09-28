import type {CommandReturn, CustomInteraction} from '../../utils/types';

export const name = 'about';
export const description = 'Info about the bot and its creator!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    return 'Made by @DanielRX#6669 with :heart: code is available on GitHub (coming soon)';
};
