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

type YoutubeTrack = {title: string | undefined, url: string, thumbnail: {url: string | undefined}, durationFormatted: string, duration: number};
const structureData = (youtubeData: Video): YoutubeTrack => {
    const {title, id, thumbnail, duration, durationFormatted} = youtubeData;
    return {title, url: `https://www.youtube.com/watch?v=${id}`, thumbnail: {url: thumbnail?.url}, durationFormatted, duration};
};

export const searchOne = async(track: Track): Promise<YoutubeTrack> => {
    const artistsAndName = concatSongNameAndArtists(track);
    return YouTube.searchOne(artistsAndName).then(structureData).catch(() => { throw new Error(youtubeNoTrack); });
};
