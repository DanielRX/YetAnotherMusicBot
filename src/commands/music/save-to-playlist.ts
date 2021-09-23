// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const YouTube = require('youtube-sr').default;
const {getData} = require('spotify-url-info');
const {searchOne} = require('../../utils/music/searchOne');
const {isSpotifyURL, validateURL} = require('../../utils/utils');
const {setupOption} = require('../../utils/utils');

export const name = 'save-to-playlist';
export const description = 'Save a song or a playlist to a custom playlist';

export const options = [
    {name: 'playlistname', description: 'What is the playlist you would like to save to?', required: true, choices: []},
    {name: 'url', description: 'What url would you like to save to playlist? It can also be a playlist url?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addStringOption(setupOption(options[1]));

const constructSongObj = (video, user)=> {
    let {durationFormatted: duration, duration: rawDuration, title, thumbnail: {url}} = video.durationFormatted;
    return {
        url: `https://www.youtube.com/watch?v=${video.id}`,
        title,
        rawDuration,
        duration,
        thumbnail: url,
        memberDisplayName: user.username,
        memberAvatar: user.avatarURL('webp', false, 16)
    };
};

const processURL = async(url, interaction) => {
    if(isSpotifyURL(url)) {
        getData(url)
            .then(async(res) => {
                if(res.tracks) {
                    const spotifyPlaylistItems = res.tracks.items;
                    const urlsArr = [];
                    for(const track of spotifyPlaylistItems) {
                        try {
                            const video = await searchOne(track.track);
                            urlsArr.push(constructSongObj(video, interaction.member.user));
                        } catch(error) {
                            console.error(error);
                        }
                    }
                    return urlsArr;
                }
                const video = await searchOne(res);
                return constructSongObj(video, interaction.member.user);
            })
            .catch((err) => console.error(err));
    } else if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
        const playlist = await YouTube.getPlaylist(url).catch(function() {
            throw new Error(':x: Playlist is either private or it does not exist!');
        });
        let videosArr = await playlist.fetch();
        videosArr = videosArr.videos;
        let urlsArr = [];
        for(const video of videosArr) {
            if(video.private) {
                continue;
            } else {
                urlsArr.push(constructSongObj(video, interaction.member.user));
            }
        }
        return urlsArr;
    } else {
        const video = await YouTube.getVideo(url).catch(function() {
            throw new Error(':x: There was a problem getting the video you provided!');
        });
        if(video.live) {
            throw new Error("I don't support live streams!");
        }
        return constructSongObj(video, interaction.member.user);
    }
};

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<import('discord.js').Message | import('discord-api-types').APIMessage>}
 */
export const execute = async(interaction) => {
    await interaction.deferReply();

    const playlistName = interaction.options.get('playlistname').value;
    const url = interaction.options.get('url').value;

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
                void interaction.followUp(`I added **${savedPlaylistsClone[location].urls[savedPlaylistsClone[location].urls.length - 1].title}** to **${playlistName}**`);
            }
            return Member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();
        });
    } else {
        return interaction.followUp(`You have no playlist named ${playlistName}`);
    }
};


