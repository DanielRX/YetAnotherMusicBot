// https://stackoverflow.com/a/5306832/9421002
const arrayMove = (arr, old_index, new_index) => {
    while(old_index < 0) {
        old_index += arr.length;
    }
    while(new_index < 0) {
        new_index += arr.length;
    }
    if(new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while(k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};

const getRandom = (arr, n) => {
    let result = new Array(n);
    let len = arr.length;
    let taken = new Array(len);
    if(n > len) {throw new RangeError('getRandom: more elements taken than available!');}
    while(n--) {
        let x = Math.floor(Math.random() * len);
        result[n] = arr[(x in taken) ? taken[x] : x];
        taken[x] = (--len in taken) ? taken[len] : len;
    }
    return result;
};

/**
 * @template T
 * @param {T[]} arr Array to get a random element of
 * @returns {T}
 */
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];

const shuffleArray = (arr) => {
    for(let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const setupOption = (config) => (option) => {
    option = option.setName(config.name).setDescription(config.description).setRequired(config.required);
    for(const choice of config.choices) { option = option.addChoice(choice, choice); }
    return option;
};

const isSpotifyURL = (arg) => arg.match(/^(spotify:|https:\/\/[a-z]+\.spotify\.com\/)/);
const isYouTubeVideoURL = (arg) => arg.match(/^(http(s)?:\/\/)?(m.)?((w){3}.)?(music.)?youtu(be|.be)?(\.com)?\/.+/);
const isYouTubePlaylistURL = (arg) => arg.match(/^https?:\/\/(music.)?(www.youtube.com|youtube.com)\/playlist(.*)$/);


const validateURL = (url) => isYouTubePlaylistURL(url) || isYouTubeVideoURL(url) || isSpotifyURL(url);

module.exports = {arrayMove, getRandom, shuffleArray, isSpotifyURL, isYouTubePlaylistURL, isYouTubeVideoURL, validateURL, randomEl, setupOption};