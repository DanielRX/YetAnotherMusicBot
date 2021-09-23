// @ts-check
const YouTube = require('youtube-sr').default;

const youtubeNoTrack = 'Something went wrong when searching for the track!';

/**
 * @param {import('../..').TrackT} data
 * @returns
 */
const concatSongNameAndArtists = (data) => {
    let artists = '';
    data.artists.forEach((artist) => (artists = artists.concat(' ', artist.name)));
    const songName = data.name;
    return `${songName} ${artists}`;
};

const structureData = (youtubeData) => {
    const {title, id, thumbnail, duration, durationFormatted} = youtubeData;
    return {title, url: `https://www.youtube.com/watch?v=${id}`, thumbnail: {url: thumbnail.url}, durationFormatted, duration};
};

/**
 * @param {import('../..').TrackT} track
 * @returns
 */
const searchOne = async(track) => {
    const artistsAndName = concatSongNameAndArtists(track);
    return YouTube.searchOne(artistsAndName).then(structureData).catch(() => new Error(youtubeNoTrack));
};

module.exports = {searchOne};
