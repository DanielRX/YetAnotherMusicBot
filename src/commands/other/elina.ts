import type {CommandReturn} from '../../utils/types';

export const name = 'elina';
export const description = 'Replies with an elina gif/video!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    return 'https://elina.live/uwu.mp4';
};
