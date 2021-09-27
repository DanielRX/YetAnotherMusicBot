import type {Video} from 'youtube-sr';
import type {Track} from '../types';

import YouTube from 'youtube-sr';

const youtubeNoTrack = 'Something went wrong when searching for the track!';

const concatSongNameAndArtists = (data: Track) => {
    let artists = '';
    data.artists.forEach((artist) => (artists = artists.concat(' ', artist)));
    const songName = data.name;
    return `${songName} ${artists}`;
};

const structureData = (youtubeData: Video): Video => {
    const {title, id, thumbnail, duration, durationFormatted} = youtubeData;
    return {title, url: `https://www.youtube.com/watch?v=${id}`, thumbnail: {url: thumbnail?.url}, durationFormatted, duration} as Video;
};

export const searchOne = async(track: Track): Promise<Video> => {
    const artistsAndName = concatSongNameAndArtists(track);
    return YouTube.searchOne(artistsAndName).then(structureData).catch(() => { throw new Error(youtubeNoTrack); });
};
