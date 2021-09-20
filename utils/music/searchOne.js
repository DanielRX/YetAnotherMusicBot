// @ts-check
const YouTube = require('youtube-sr').default;

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

/**
 * @param {import('../..').Track} track
 * @returns
 */
module.exports.searchOne = async(track) => {
    return new Promise(async(resolve, reject) => {
        const artistsAndName = concatSongNameAndArtists(track);
        try {
            const {title, id, thumbnail, duration, durationFormatted} = await YouTube.searchOne(artistsAndName);
            resolve({title, url: `https://www.youtube.com/watch?v=${id}`, thumbnail: {url: thumbnail.url}, durationFormatted, duration});
        } catch{
            reject('Something went wrong when searching for the track!');
        }
    });
};


