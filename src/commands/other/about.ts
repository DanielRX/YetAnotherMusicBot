import {getAndFillMessage} from '../../utils/messages';
import type {CommandReturn} from '../../utils/types';

export const name = 'about';
export const description = 'Info about the bot and its creator!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    return getAndFillMessage('about', 'en_gb')('ABOUT');
};
