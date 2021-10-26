import type {User} from 'discord.js';
import type {Video} from 'youtube-sr';
import type {CommandInput, CommandReturn, CustomInteraction, PlayTrack, Track} from '../../utils/types';
import member from '../../utils/models/Member';
import YouTube from 'youtube-sr';
import {getData as gd} from 'spotify-url-info';
import {searchOne} from '../../utils/music/searchOne';
import {filterEmpty, isSpotifyURL, validateURL} from '../../utils/utils';
import {logger} from '../../utils/logging';

export const name = 'save-to-playlist';
export const description = 'Save a song or a playlist to a custom playlist';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'What is the playlist you would like to save to?', required: true, choices: []},
    {type: 'string' as const, name: 'url', description: 'What url would you like to save to playlist? It can also be a playlist url?', required: true, choices: []}
];

// TODO: Don't use defaults, fix type
const constructSongObj = (video: Video, user: User): PlayTrack => {
    const {durationFormatted: duration, duration: rawDuration, title, thumbnail} = video;
    return {
        url: `https://www.youtube.com/watch?v=${video.id}`,
        name: title ?? '',
        rawDuration,
        duration,
        thumbnail: thumbnail?.url ?? '',
        memberDisplayName: user.username,
        memberAvatar: user.avatarURL({format: 'webp', dynamic: false, size: 16}) ?? ''
    } as PlayTrack;
};

const getData: (url: string) => Promise<Track | {tracks: {items: ({track: Track})[]}}> = gd;

const processTrack = (user: User) => async(track: {track: Track}): Promise<PlayTrack> => searchOne(track.track).then((video) => constructSongObj(video, user));

const processURL = async(url: string, interaction: CustomInteraction, messages: CommandInput['messages']) => {
    if(isSpotifyURL(url)) {
        return getData(url)
            .then(async(res: Track | {tracks: {items: ({track: Track})[]}}) => {
                if('tracks' in res) {
                    const spotifyPlaylistItems = res.tracks.items;
                    return Promise.all(spotifyPlaylistItems.map(processTrack(interaction.member.user))).then(filterEmpty);
                }
                return searchOne(res).then((video) => constructSongObj(video, interaction.member.user));
            })
            .catch((e: unknown) => { logger.error(e); });
    }
    if(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(url)) {
        const playlist = await YouTube.getPlaylist(url).catch(async()=> {
            return messages.PLAYLIST_DOES_NOT_EXIST();
        });
        if(typeof playlist === 'string') { return playlist; }
        const videosArr = await playlist.fetch().then((v) => v.videos);
        const urlsArr = videosArr.filter((v) => !v.private).map((v) => constructSongObj(v, interaction.member.user));
        return urlsArr;
    }
    const video = await YouTube.getVideo(url).catch(async() => {
        return messages.CANT_GET_VIDEO();
    });
    if(typeof video === 'string') { return video; }

    if(video.live) { return messages.NO_LIVE(); }
    return constructSongObj(video, interaction.member.user);
};

export const execute = async({interaction, messages, params: {playlistName, url}}: CommandInput<{playlistName: string, url: string}>): Promise<CommandReturn> => {
    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return messages.NO_SAVED_PLAYLISTS(); }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) { return messages.NO_SAVED_PLAYLISTS(); }

    if(!validateURL(url)) { return messages.INVALID_URL(); }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) { return messages.PLAYLIST_NOT_FOUND({playlistName}); }
    let urlsArrayClone = savedPlaylistsClone[location].urls;
    const processedURL = await processURL(url, interaction, messages);
    if(typeof processedURL === 'string') { throw new Error(processedURL); }
    if(!processedURL) return messages.MISSING_ERR_MESSAGE();
    if(Array.isArray(processedURL)) {
        urlsArrayClone = urlsArrayClone.concat(processedURL);
        savedPlaylistsClone[location].urls = urlsArrayClone;
        await member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();
        return messages.SUCCESS_PLAYLIST();
    }

    urlsArrayClone.push(processedURL);
    savedPlaylistsClone[location].urls = urlsArrayClone;
    await member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();
    return messages.SUCCESS_APPEND({name: savedPlaylistsClone[location].urls.slice(-1)[0].name, playlistName});
};
