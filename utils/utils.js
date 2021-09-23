// https://stackoverflow.com/a/5306832/9421002
const fetch = require('node-fetch');
const {SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandBooleanOption} = require('@discordjs/builders');

/**
 * @template T
 * @param {T[]} arr
 * @param {number} old_index
 * @param {number} new_index
 * @returns {T[]}
 */
const arrayMove = (arr, old_index, new_index) => {
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

/**
 * @template T
 * @param {T[]} arr
 * @returns
 */
const shuffleArray = (arr) => {
    for(let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/**
 * @template T
 * @param {T[]} arr
 * @param {number} n
 * @returns {T[]}
 */
const getRandom = (arr, n) => {
    if(n > arr.length) {throw new RangeError('getRandom: more elements taken than available!');}
    return shuffleArray(arr).slice(0, n);
};

/**
 * @template T
 * @param {T[]} arr Array to get a random element of
 * @returns {T}
 */
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * @template {SlashCommandStringOption | SlashCommandIntegerOption | SlashCommandBooleanOption } T
 * @param {{name: string, description: string, required: boolean, choices: string[]}} config
 * @returns {(option: T) => T}
 */
const setupOption = (config) => (option) => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    if(option instanceof SlashCommandBooleanOption && config.choices.length > 0) { throw new Error('Unable to add choice to boolean command option'); }
    if(option instanceof SlashCommandIntegerOption || option instanceof SlashCommandStringOption) {
        for(const choice of config.choices) { option = option.addChoice(choice, choice); }
    }
    return option;
};

/** @param {string} arg */
const isSpotifyURL = (arg) => /^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/.exec(arg);
/** @param {string} arg */
const isYouTubeVideoURL = (arg) => /^(http(s)?:\/\/)?(m.)?((w){3}.)?(music.)?youtu(be|.be)?(\.com)?\/.+/.exec(arg);
/** @param {string} arg */
const isYouTubePlaylistURL = (arg) => /^https?:\/\/(music.)?(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(arg);

/** @param {string} url */
const validateURL = (url) => isYouTubePlaylistURL(url) || isYouTubeVideoURL(url) || isSpotifyURL(url);

module.exports = {fetch, arrayMove, getRandom, shuffleArray, isSpotifyURL, isYouTubePlaylistURL, isYouTubeVideoURL, validateURL, randomEl, setupOption};
