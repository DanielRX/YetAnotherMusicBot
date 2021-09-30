import type {User} from 'discord.js';
import type {Video} from 'youtube-sr';
import type {CommandReturn, CustomInteraction, PlayTrack, Track} from '../../utils/types';
import member from '../../utils/models/Member';
import YouTube from 'youtube-sr';
import {getData} from 'spotify-url-info';
import {searchOne} from '../../utils/music/searchOne';
import {isSpotifyURL, validateURL} from '../../utils/utils';
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

const processURL = async(url: string, interaction: CustomInteraction) => {
    if(isSpotifyURL(url)) {
        return getData(url)
            .then(async(res: Track | {tracks: {items: ({track: Track})[]}}) => {
                if('tracks' in res) {
                    const spotifyPlaylistItems = res.tracks.items;
                    const urlsArr = [];
                    for(const track of spotifyPlaylistItems) {
                        try {
                            const video = await searchOne(track.track);
                            urlsArr.push(constructSongObj(video, interaction.member.user));
                        } catch(e: unknown) {
                            logger.error(e);
                        }
                    }
                    return urlsArr;
                }
                const video = await searchOne(res);
                return constructSongObj(video, interaction.member.user);
            })
            .catch((e: unknown) => { logger.error(e); });
    }
    if(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(url)) {
        const playlist = await YouTube.getPlaylist(url).catch(function() {
            throw new Error(':x: Playlist is either private or it does not exist!');
        });
        const videosArr = await playlist.fetch().then((v) => v.videos);
        const urlsArr = [];
        for(const video of videosArr) {
            if(video.private) {
                continue;
            } else {
                urlsArr.push(constructSongObj(video, interaction.member.user));
            }
        }
        return urlsArr;
    }
    const video = await YouTube.getVideo(url).catch(() => {
        throw new Error(':x: There was a problem getting the video you provided!');
    });
    if(video.live) {
        throw new Error("I don't support live streams!");
    }
    return constructSongObj(video, interaction.member.user);
};

export const execute = async(interaction: CustomInteraction, playlistName: string, url: string): Promise<CommandReturn> => {
    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return 'You have no custom playlists!'; }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) { return 'You have no custom playlists!'; }

    if(!validateURL(url)) { return 'Please enter a valid YouTube or Spotify URL!'; }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) { return `You have no playlist named ${playlistName}`; }
    let urlsArrayClone = savedPlaylistsClone[location].urls;
    return processURL(url, interaction).then(async(processedURL) => {
        if(!processedURL) return;
        if(Array.isArray(processedURL)) {
            urlsArrayClone = urlsArrayClone.concat(processedURL);
            savedPlaylistsClone[location].urls = urlsArrayClone;
            await member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();
            return 'The playlist you provided was successfully saved!';
        }

        urlsArrayClone.push(processedURL);
        savedPlaylistsClone[location].urls = urlsArrayClone;
        await member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();
        return `I added **${savedPlaylistsClone[location].urls[savedPlaylistsClone[location].urls.length - 1].name}** to **${playlistName}**`;
    });
};
