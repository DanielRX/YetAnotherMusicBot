// https://stackoverflow.com/a/5306832/9421002
const f = require('node-fetch');
import {SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandBooleanOption, SlashCommandUserOption} from '@discordjs/builders';
import type {OptionConfig, SlashCommandOption} from './types';

const arrayMove = <T>(arr: T[], oldIndex: number, newIndex: number): T[] => {
    while(oldIndex < 0) {
        oldIndex += arr.length;
    }
    while(newIndex < 0) {
        newIndex += arr.length;
    }
    if(newIndex >= arr.length) {
        let k = newIndex - arr.length + 1;
        while(k--) {
            arr.push(undefined as unknown as T);
        }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
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

const setupStringOption = (config: OptionConfig) => (option: SlashCommandStringOption): SlashCommandStringOption => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    for(const choice of config.choices) { option = option.addChoice(choice, choice); }
    return option;
};

const setupIntOption = (config: OptionConfig) => (option: SlashCommandIntegerOption): SlashCommandIntegerOption => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    for(const choice of config.choices) { option = option.addChoice(choice, parseInt(choice)); }
    return option;
};

const setupBoolOption = (config: OptionConfig) => (option: SlashCommandBooleanOption): SlashCommandBooleanOption => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    return option;
};

const setupUserOption = (config: OptionConfig) => (option: SlashCommandUserOption): SlashCommandUserOption => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    return option;
};

const setupOption = <T extends SlashCommandOption>(config: OptionConfig) => (option: T): T => {
    if(option instanceof SlashCommandBooleanOption) { return setupBoolOption(config)(option) as T; }
    if(option instanceof SlashCommandIntegerOption) { return setupIntOption(config)(option) as T; }
    if(option instanceof SlashCommandStringOption) { return setupStringOption(config)(option) as T; }
    if(option instanceof SlashCommandUserOption) { return setupUserOption(config)(option) as T; }
    return option;
};

const isSpotifyURL = (arg: string): boolean => (/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/.test(arg));
const isYouTubeVideoURL = (arg: string): boolean => (/^(http(s)?:\/\/)?(m.)?((w){3}.)?(music.)?youtu(be|.be)?(\.com)?\/.+/.test(arg));
const isYouTubePlaylistURL = (arg: string): boolean => (/^https?:\/\/(music.)?(www.youtube.com|youtube.com)\/playlist(.*)$/.test(arg));

const validateURL = (url: string): boolean => isYouTubePlaylistURL(url) || isYouTubeVideoURL(url) || isSpotifyURL(url);

// eslint-disable-next-line @typescript-eslint/naming-convention
type FetchConfig = {method?: 'GET' | 'POST', headers?: {'client-id'?: string, Authorization: string}};
const fetch = f as <T>(url: string, config?: FetchConfig) => Promise<{slug: string, status: string, json: () => Promise<T & {length: number}>, text: () => Promise<string>}>;

export {fetch, arrayMove, getRandom, shuffleArray, isSpotifyURL, isYouTubePlaylistURL, isYouTubeVideoURL, validateURL, randomEl, setupOption};
