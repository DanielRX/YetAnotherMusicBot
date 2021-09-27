import type {APIMessage} from 'discord-api-types';
import type {Message, User} from 'discord.js';
import type {Video} from 'youtube-sr';
import type {CustomInteraction, PlayTrack, Track} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import Member from '../../utils/models/Member';
import YouTube from 'youtube-sr';
import {getData} from 'spotify-url-info';
import {searchOne} from '../../utils/music/searchOne';
import {isSpotifyURL, validateURL, setupOption} from '../../utils/utils';

export const name = 'save-to-playlist';
export const description = 'Save a song or a playlist to a custom playlist';

export const options = [
    {name: 'playlistname', description: 'What is the playlist you would like to save to?', required: true, choices: []},
    {name: 'url', description: 'What url would you like to save to playlist? It can also be a playlist url?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addStringOption(setupOption(options[1]));

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
        getData(url)
            .then(async(res: Track | {tracks: {items: ({track: Track})[]}}) => {
                if('tracks' in res) {
                    const spotifyPlaylistItems = res.tracks.items;
                    const urlsArr = [];
                    for(const track of spotifyPlaylistItems) {
                        try {
                            const video = await searchOne(track.track);
                            urlsArr.push(constructSongObj(video, interaction.member.user));
                        } catch(e: unknown) {
                            console.error(e);
                        }
                    }
                    return urlsArr;
                }
                const video = await searchOne(res);
                return constructSongObj(video, interaction.member.user);
            })
            .catch((e: unknown) => console.error(e));
    } else if(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(url)) {
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
    } else {
        const video = await YouTube.getVideo(url).catch(() => {
            throw new Error(':x: There was a problem getting the video you provided!');
        });
        if(video.live) {
            throw new Error("I don't support live streams!");
        }
        return constructSongObj(video, interaction.member.user);
    }
};

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message | void> => {
    await interaction.deferReply();

    const playlistName = interaction.options.get('playlistname')?.value;
    const url = `${interaction.options.get('url')?.value}`;

    const userData = await Member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return interaction.followUp('You have no custom playlists!'); }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) { return interaction.followUp('You have no custom playlists!'); }

    if(!validateURL(url)) { return interaction.followUp('Please enter a valid YouTube or Spotify URL!'); }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location !== -1) {
        let urlsArrayClone = savedPlaylistsClone[location].urls;
        void processURL(url, interaction).then((processedURL) => {
            if(!processedURL) return;
            if(Array.isArray(processedURL)) {
                urlsArrayClone = urlsArrayClone.concat(processedURL);
                savedPlaylistsClone[location].urls = urlsArrayClone;
                void interaction.followUp('The playlist you provided was successfully saved!');
            } else {
                urlsArrayClone.push(processedURL);
                savedPlaylistsClone[location].urls = urlsArrayClone;
                void interaction.followUp(`I added **${savedPlaylistsClone[location].urls[savedPlaylistsClone[location].urls.length - 1].name}** to **${playlistName}**`);
            }
            return Member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();
        });
    } else {
        return interaction.followUp(`You have no playlist named ${playlistName}`);
    }
};
