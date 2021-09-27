// https://stackoverflow.com/a/5306832/9421002
import f from 'node-fetch';
import type {SlashCommandUserOption} from '@discordjs/builders';
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
            arr.push(undefined as unknown as T);
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

type SlashCommandOption = SlashCommandBooleanOption | SlashCommandIntegerOption | SlashCommandStringOption | SlashCommandUserOption;

const setupStringOption = (config: {name: string, description: string, required: boolean, choices: string[]}) => (option: SlashCommandStringOption): SlashCommandStringOption => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    for(const choice of config.choices) { option = option.addChoice(choice, choice); }
    return option;
};

const setupIntOption = (config: {name: string, description: string, required: boolean, choices: string[]}) => (option: SlashCommandIntegerOption): SlashCommandIntegerOption => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    for(const choice of config.choices) { option = option.addChoice(choice, parseInt(choice)); }
    return option;
};

const setupBoolOption = (config: {name: string, description: string, required: boolean, choices: string[]}) => (option: SlashCommandBooleanOption): SlashCommandBooleanOption => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    return option;
};

const setupOption = <T extends SlashCommandOption>(config: {name: string, description: string, required: boolean, choices: string[]}) => (option: T): T => {
    if(option instanceof SlashCommandBooleanOption) { return setupBoolOption(config)(option) as T; }
    if(option instanceof SlashCommandIntegerOption) { return setupIntOption(config)(option) as T; }
    if(option instanceof SlashCommandStringOption) { return setupStringOption(config)(option) as T; }
    return option;
};

const isSpotifyURL = (arg: string): boolean => (/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/.test(arg));
const isYouTubeVideoURL = (arg: string): boolean => (/^(http(s)?:\/\/)?(m.)?((w){3}.)?(music.)?youtu(be|.be)?(\.com)?\/.+/.test(arg));
const isYouTubePlaylistURL = (arg: string): boolean => (/^https?:\/\/(music.)?(www.youtube.com|youtube.com)\/playlist(.*)$/.test(arg));

const validateURL = (url: string): boolean => isYouTubePlaylistURL(url) || isYouTubeVideoURL(url) || isSpotifyURL(url);

type FetchConfig = {method?: 'GET' | 'POST', headers?: {'client-id'?: string, Authorization: string}};
const fetch = f as <T>(url: string, config?: FetchConfig) => Promise<{slug: string, status: string, json: () => Promise<T & {length: number}>, text: () => Promise<string>}>;

export {fetch, arrayMove, getRandom, shuffleArray, isSpotifyURL, isYouTubePlaylistURL, isYouTubeVideoURL, validateURL, randomEl, setupOption};
