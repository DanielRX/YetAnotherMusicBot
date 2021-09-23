// @ts-check
const YouTube = require('youtube-sr').default;

const youtubeNoTrack = 'Something went wrong when searching for the track!';

/**
 * @param {import('../..').Track} data
 * @returns
 */
const concatSongNameAndArtists = (data) => {
    let artists = '';
    data.artists.forEach((artist) => (artists = artists.concat(' ', artist)));
    const songName = data.name;
    return `${songName} ${artists}`;
};

/**
 * @param {import('youtube-sr').Video} youtubeData
 */
const structureData = (youtubeData) => {
    const {title, id, thumbnail, duration, durationFormatted} = youtubeData;
    return {title, url: `https://www.youtube.com/watch?v=${id}`, thumbnail: {url: thumbnail.url}, durationFormatted, duration};
};

/**
 * @param {import('../..').Track} track
 * @returns
 */
const searchOne = async(track) => {
    const artistsAndName = concatSongNameAndArtists(track);
    return YouTube.searchOne(artistsAndName).then(structureData).catch(() => new Error(youtubeNoTrack));
};

module.exports = {searchOne};
