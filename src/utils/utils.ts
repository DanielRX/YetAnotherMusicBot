// https://stackoverflow.com/a/5306832/9421002
import fetch from 'node-fetch';
import {SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandBooleanOption} from '@discordjs/builders';

const arrayMove = <T>(arr: T[], old_index: number, new_index: number): T[] => {
    while(old_index < 0) {
        old_index += arr.length;
    }
    while(new_index < 0) {
        new_index += arr.length;
    }
    if(new_index >= arr.length) {
        let k = new_index - arr.length + 1;
        while(k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};

const shuffleArray = <T>(arr: T[]): T[] => {
    for(let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const getRandom = <T>(arr: T[], n: number): T[] => {
    if(n > arr.length) {throw new RangeError('getRandom: more elements taken than available!');}
    return shuffleArray(arr).slice(0, n);
};

const randomEl = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const setupOption = (config: {name: string, description: string, required: boolean, choices: string[]}) => (option: SlashCommandBooleanOption | SlashCommandIntegerOption | SlashCommandStringOption) => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    if(option instanceof SlashCommandBooleanOption && config.choices.length > 0) { throw new Error('Unable to add choice to boolean command option'); }
    if(option instanceof SlashCommandIntegerOption) { for(const choice of config.choices) { option = option.addChoice(choice, choice); } }
    if(option instanceof SlashCommandStringOption) { for(const choice of config.choices) { option = option.addChoice(choice, choice); } }
    return option;
};

const isSpotifyURL = (arg: string): RegExpExecArray | null => /^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/.exec(arg);
const isYouTubeVideoURL = (arg: string): RegExpExecArray | null => /^(http(s)?:\/\/)?(m.)?((w){3}.)?(music.)?youtu(be|.be)?(\.com)?\/.+/.exec(arg);
const isYouTubePlaylistURL = (arg: string): RegExpExecArray | null => /^https?:\/\/(music.)?(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(arg);

const validateURL = (url: string): RegExpExecArray | null => isYouTubePlaylistURL(url) || isYouTubeVideoURL(url) || isSpotifyURL(url);

export {fetch, arrayMove, getRandom, shuffleArray, isSpotifyURL, isYouTubePlaylistURL, isYouTubeVideoURL, validateURL, randomEl, setupOption};
