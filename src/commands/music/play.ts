import type {APIMessage} from 'discord-api-types';
import type {Message, VoiceChannel} from 'discord.js';
import type {CustomAudioPlayer, CustomInteraction} from '../../utils/types';

// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageSelectMenu, MessageActionRow} = require('discord.js');
const Player = require('../../utils/music/Player');
const {getData} = require('spotify-url-info');
const YouTube = require('youtube-sr').default;
const options = require('../../../options.json'); //TODO: Replace with file that fills in defaults
const Member = require('../../utils/models/Member');
const {joinVoiceChannel, entersState, VoiceConnectionStatus, AudioPlayerStatus} = require('@discordjs/voice');
const createGuildData = require('../../utils/createGuildData');
const {searchOne} = require('../../utils/music/searchOne');
const {shuffleArray, isSpotifyURL, isYouTubeVideoURL, isYouTubePlaylistURL} = require('../../utils/utils');
const {getFlags, createSelectMenu, createHistoryRow} = require('../../utils/music/play-utils');
const {setupOption} = require('../../utils/utils');

// Check If Options are Valid
if(typeof options.playLiveStreams !== 'boolean') options.playLiveStreams = true;
if(typeof options.maxQueueLength !== 'number' || options.maxQueueLength < 1) { options.maxQueueLength = 1000; }
if(typeof options.LeaveTimeOut !== 'number') { options.LeaveTimeOut = 90; }
if(typeof options.MaxResponseTime !== 'number') { options.MaxResponseTime = 30; }
if(typeof options.AutomaticallyShuffleYouTubePlaylists !== 'boolean') { options.AutomaticallyShuffleYouTubePlaylists = false; }
if(typeof options.playVideosLongerThan1Hour !== 'boolean') { options.playVideosLongerThan1Hour = true; }
if(typeof options.deleteOldPlayMessage !== 'boolean') { options.deleteOldPlayMessage = false; }

// If the Options are outside of min or max then use the closest number
options.LeaveTimeOut = Math.max(Math.min(options.LeaveTimeOut, 600), 1);
options.MaxResponseTime = Math.max(Math.min(options.MaxResponseTime, 150), 5);

const deletePlayerIfNeeded = (interaction: CustomInteraction) => {
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player) {
        if((player.queue.length && !player.nowPlaying) || (!player.queue.length && !player.nowPlaying)) { return; }
        return interaction.client.playerManager.delete(interaction.guildId);
    }
};

const constructSongObj = (video, voiceChannel, user, timestamp) => {
    const {url, title, duration: rawDuration, durationFormatted, thumbnail} = video;
    let duration = durationFormatted;
    if(duration === '00:00') duration = 'Live Stream';
    // checks if the user searched for a song using a Spotify URL
    return {url, title, rawDuration, duration, timestamp, thumbnail: thumbnail.url, voiceChannel, memberDisplayName: user.username, memberAvatar: user.avatarURL('webp', false, 16)};
};

const handleSubscription = async(queue, interaction, player) => {
    let voiceChannel = queue[0].voiceChannel;
    if(!voiceChannel) {
        // happens when loading a saved playlist
        voiceChannel = interaction.member.voice.channel;
    }

    const title = player.queue[0].title;
    let connection = player.connection;
    if(!connection) {
        connection = joinVoiceChannel({channelId: voiceChannel.id, guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator});
        connection.on('error', console.error);
    }
    player.textChannel = interaction.channel;
    player.passConnection(connection);

    try {
        await entersState(player.connection, VoiceConnectionStatus.Ready, 10000);
    } catch(err) {
        player.commandLock = false;
        deletePlayerIfNeeded(interaction);
        console.error(err);
        await interaction.followUp({content: 'Failed to join your channel!'});
        return;
    }
    player.process(player.queue);
    await interaction.followUp(`Enqueued ${title}`);
};

const flagLogic = (interaction: CustomInteraction, video, jumpFlag: boolean) => {
    const player = interaction.client.playerManager.get(interaction.guildId);
    player?.queue.splice(0, 0, constructSongObj(video, interaction.member.voice.channel, interaction.member.user));
    if(jumpFlag && player?.audioPlayer.state.status === AudioPlayerStatus.Playing) {
        player.loopSong = false;
        player?.audioPlayer.stop();
    }
};

const handleSpotifyPlaylistData = async(interaction: CustomInteraction, data) => {
    const player = interaction.client.playerManager.get(interaction.guildId);
    const rawQuery = `${interaction.options.get('query')?.value}`;
    const {nextFlag, jumpFlag} = getFlags(rawQuery);
    const spotifyPlaylistItems = data.tracks.items;
    const processingMessage = await interaction.channel?.send({content: 'Processing Playlist...'});
    for(const item of spotifyPlaylistItems) {
        const {artists, name, track} = item;
        try {
            const trackData = (data.type == 'album') ? {artists, name} : track;
            const video = await searchOne(trackData);
            if(nextFlag || jumpFlag) {
                flagLogic(interaction, video, jumpFlag);
            } else {
                player.queue.push(constructSongObj(video, interaction.member.voice.channel, interaction.member.user));
            }
        } catch(err) {
            void processingMessage?.delete();
            return void interaction.followUp('Failed to process playlist, please try again later');
        }
    }
    void processingMessage?.edit('Playlist Processed!');
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return handleSubscription(player.queue, interaction, player); }
};

const handleSpotifyURL = (interaction: CustomInteraction): Promise<APIMessage | Message> => {
    const player = interaction.client.playerManager.get(interaction.guildId);
    const rawQuery = interaction.options.get('query')?.value;
    const {nextFlag, jumpFlag, query} = getFlags(rawQuery);
    const handleSpotifyData = async(data) => {
        // 'tracks' property only exists on a playlist data object
        if(data.tracks) {
            // handle playlist
            return handleSpotifyPlaylistData(interaction, data);
        }
        // single track

        try {
            const video = await searchOne(data);
            if(nextFlag || jumpFlag) {
                flagLogic(interaction, video, jumpFlag);
            } else {
                player?.queue.push(constructSongObj(video, interaction.member.voice.channel, interaction.member.user));
                player.commandLock = false;
                if(player?.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
                    return handleSubscription(player?.queue, interaction, player);
                }
                return interaction.followUp(`Added **${video.title}** to queue`);
            }
        } catch(error: unknown) {
            return interaction.followUp(error);
        }
    };

    return getData(query).then(handleSpotifyData).catch((error: unknown) => {
        deletePlayerIfNeeded(interaction);
        console.error(error);
        return interaction.followUp(`I couldn't find what you were looking for :(`);
    });
};

const searchYoutube = async(interaction: CustomInteraction, voiceChannel: VoiceChannel): Promise<APIMessage | Message> => {
    const player = interaction.client.playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;
    const rawQuery = interaction.options.get('query')?.value;
    const {nextFlag, jumpFlag, query} = getFlags(rawQuery);
    const videos = await YouTube.search(query, {limit: 5}).catch(async function() {
        return interaction.followUp(':x: There was a problem searching the video you requested!');
    });
    if(!videos) {
        player.commandLock = false;
        return interaction.followUp(`:x: I had some trouble finding what you were looking for, please try again or be more specific.`);
    }
    if(videos.length < 5) {
        player.commandLock = false;
        return interaction.followUp(`:x: I had some trouble finding what you were looking for, please try again or be more specific.`);
    }
    const vidNameArr = [...videos.map((video) => video.title.slice(0, 99)), 'cancel'];
    const row = createSelectMenu(vidNameArr);
    const playOptions = await interaction.channel?.send({content: 'Pick a video', components: [row]});
    const playOptionsCollector = playOptions?.createMessageComponentCollector({componentType: 'SELECT_MENU', time: options.MaxResponseTime * 1000});
    playOptionsCollector?.on('end', async() => {
        if(playOptions) {
            await playOptions.delete().catch(console.error);
        }
    });

    const handleYoutubeData = (video) => {
        const playerManager = interaction.client.playerManager.get(interaction.guildId);
        if(video.live && !options.playLiveStreams) {
            if(playOptions) {
                playOptions.delete().catch(console.error);
                return;
            }
            player.commandLock = false;
            return interaction.followUp('Live streams are disabled in this server! Contact the owner');
        }

        if(video.duration.hours !== 0 && !options.playVideosLongerThan1Hour) {
            if(playOptions) {
                playOptions.delete().catch(console.error);
                return;
            }
            player.commandLock = false;
            return interaction.followUp('Videos longer than 1 hour are disabled in this server! Contact the owner');
        }

        if(playerManager.queue.length > options.maxQueueLength) {
            if(playOptions) {
                playOptions.delete().catch(console.error);
                return;
            }
            player.commandLock = false;
            return interaction.followUp(`The queue hit its limit of ${options.maxQueueLength}, please wait a bit before attempting to add more songs`);
        }
        const audioPlayer = playerManager?.audioPlayer;
        if(nextFlag || jumpFlag) {
            playerManager?.queue.unshift(constructSongObj(video, voiceChannel, interaction.member.user));
            if(jumpFlag && audioPlayer?.state.status === AudioPlayerStatus.Playing) {
                playerManager.loopSong = false;
                audioPlayer?.stop();
                return interaction.followUp('Skipped song!');
            }
        } else {
            playerManager?.queue.push(constructSongObj(video, voiceChannel, interaction.member.user));
        }
        if(audioPlayer?.state.status !== AudioPlayerStatus.Playing) {
            const newPlayer = playerManager;
            void handleSubscription(newPlayer?.queue, interaction, newPlayer);
        } else if(audioPlayer?.state.status === AudioPlayerStatus.Playing) {
            player.commandLock = false;
            return interaction.followUp(`Added **${video.title}** to queue`);
        }
        return;
    };

    playOptionsCollector?.on('collect', async(i) => {
        if(i.user.id !== interaction.user.id) {
            return i.reply({content: 'This element is not for you!', ephemeral: true});
        }
        playOptionsCollector?.stop();
        const value = i.values[0];
        if(value === 'cancel_option') {
            if(playOptions) {
                player.commandLock = false;
                void interaction.followUp('Search canceled');
            }
        }
        const videoIndex = parseInt(value);

        YouTube.getVideo(`https://www.youtube.com/watch?v=${videos[videoIndex - 1].id}`)
            .then(handleYoutubeData)
            .catch((error: unknown) => {
                player.commandLock = false;
                deletePlayerIfNeeded(interaction);
                if(playOptions) playOptions.delete().catch(console.error);
                console.error(error);
                return interaction.followUp('An error has occurred while trying to get the video ID from youtube.');
            });
    });
};

const handleYoutubeURL = async(interaction: CustomInteraction): Promise<APIMessage | Message> => {
    const player = interaction.client.playerManager.get(interaction.guildId);
    const rawQuery = interaction.options.get('query')?.value;
    const {nextFlag, jumpFlag, query} = getFlags(rawQuery);
    const timestampRegex = /t=([^#&\n\r]+)/g;
    let timestamp = timestampRegex.exec(query);
    if(!timestamp) {
        timestamp = 0;
    } else {
        timestamp = timestamp[1];
        if(timestamp.endsWith('s')) {
            timestamp = timestamp.substring(0, timestamp.indexOf('s'));
        }
        if(!Number(timestamp)) timestamp = 0;
    }
    timestamp = Number(timestamp);

    const video = await YouTube.getVideo(query).catch(function() {
        deletePlayerIfNeeded(interaction);
        return interaction.followUp(':x: There was a problem getting the video you provided!');
    });
    if(!video) return;
    if(video.live === 'live' && !options.playLiveStreams) {
        player.commandLock = false;
        deletePlayerIfNeeded(interaction);
        return interaction.followUp('Live streams are disabled in this server! Contact the owner');
    }

    if(video.duration.hours !== 0 && !options.playVideosLongerThan1Hour) {
        player.commandLock = false;
        deletePlayerIfNeeded(interaction);
        return interaction.followUp('Videos longer than 1 hour are disabled in this server! Contact the owner');
    }

    if(player.length > options.maxQueueLength) {
        player.commandLock = false;
        return interaction.followUp(`The queue hit its limit of ${options.maxQueueLength}, please wait a bit before attempting to play more songs`);
    }
    if(nextFlag || jumpFlag) {
        flagLogic(interaction, video, jumpFlag);
    } else {
        player.queue.push(constructSongObj(video, interaction.member.voice.channel, interaction.member.user, timestamp));
    }

    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        void handleSubscription(player.queue, interaction, player);
    }
};

const handleYoutubePlaylistURL = async(interaction: CustomInteraction): Promise<APIMessage | Message> => {
    const player = interaction.client.playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;
    const rawQuery = `${interaction.options.get('query')?.value}`;
    const {nextFlag, jumpFlag, shuffleFlag, reverseFlag, query} = getFlags(rawQuery);

    const playlist = await YouTube.getPlaylist(query);
    if(!playlist) {
        deletePlayerIfNeeded(interaction);
        return interaction.followUp(':x: Playlist is either private or it does not exist!');
    }

    let videosArr = await playlist.fetch();
    if(!videosArr) {
        player.commandLock = false;
        deletePlayerIfNeeded(interaction);
        return interaction.followUp(":x: I hit a problem when trying to fetch the playlist's videos");
    }
    videosArr = videosArr.videos;

    if(options.AutomaticallyShuffleYouTubePlaylists || shuffleFlag) {
        videosArr = shuffleArray(videosArr);
    }

    if(reverseFlag) {
        videosArr = videosArr.reverse();
    }

    if(player.queue.length >= options.maxQueueLength) {
        player.commandLock = false;
        return interaction.followUp('The queue is full, please try adding more songs later');
    }
    videosArr = videosArr.splice(0, options.maxQueueLength - player.queue.length);

    //variable to know how many songs were skipped because of privacyStatus
    let skipAmount = 0;

    await videosArr.reduce(async(__, video, key) => {
        // don't process private videos
        if(video.private) {
            skipAmount++;
            return;
        }
        if(nextFlag || jumpFlag) {
            player.queue.splice(key - skipAmount, 0, constructSongObj(video, interaction.member.voice.channel, interaction.member.user));
        } else {
            player.queue.push(constructSongObj(video, interaction.member.voice.channel, interaction.member.user));
        }
    });
    if(jumpFlag && player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
        player.loopSong = false;
        player.audioPlayer.stop();
    }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        return void handleSubscription(player.queue, interaction, player);
    }
    // interactiveEmbed(interaction)
    //   .addField('Added Playlist', `[${playlist.title}](${playlist.url})`)
    //   .build();
    player.commandLock = false;
    return interaction.followUp('Added playlist to queue!');
};

const handlePlayFromHistory = async(interaction: CustomInteraction, message: Message): Promise<APIMessage | Message | void> => {
    const player = interaction.client.playerManager.get(interaction.guildId);
    const rawQuery = interaction.options.get('query')?.value;
    const {nextFlag, jumpFlag, query} = getFlags(rawQuery);
    const index = Number(query) - 1;
    // continue if there's no index matching the query on the history queue
    if(typeof player?.queueHistory[index] === 'undefined') { return; }
    const row = createHistoryRow(query);
    const clarificationOptions = await message.channel.send({
        content: 'Did you mean to play a song from the history queue?',
        components: [row]
    });
    const clarificationCollector = clarificationOptions.createMessageComponentCollector({
        componentType: 'SELECT_MENU',
        time: options.MaxResponseTime * 1000
    });

    clarificationCollector.on('collect', async(i) => {
        if(i.user.id !== interaction.user.id) {
            void i.reply({content: `This element is not for you!`, ephemeral: true});
            return;
        }
        clarificationCollector.stop();
        const value = i.values[0];

        switch(value) {
            // 1: Play a song from the history queue
            case'history_option':
                if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
                    player.queue.unshift(player.queueHistory[index]);
                    void handleSubscription(player.queue, interaction, player);
                    break;
                }
                if(nextFlag || jumpFlag) {
                    player.queue.unshift(player.queueHistory[index]);
                    if(jumpFlag && player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
                        player.loopSong = false;
                        player.audioPlayer.stop();
                    }
                } else {
                    player.queue.push(player.queueHistory[index]);
                }
                player.commandLock = false;
                void interaction.followUp(`'${player.queueHistory[index].title}' was added to queue!`);
                break;
                // 2: Search for the query on YouTube
            case'youtube_option':
                await searchYoutube(interaction, interaction.member.voice.channel);
                break;
                // 3: Cancel
            case'cancel_option':
                deletePlayerIfNeeded(interaction);
                void interaction.followUp('Canceled search');
                break;
        }
    });
};

const handlePlayPlaylist = async(interaction: CustomInteraction, message: Message, playlistsArray, found: boolean): Promise<APIMessage | Message | void> => {
    const player = interaction.client.playerManager.get(interaction.guildId);
    const rawQuery = interaction.options.get('query')?.value;
    const {nextFlag, jumpFlag, query} = getFlags(rawQuery);
    const fields = [
        {label: 'Playlist', description: 'Select playlist', value: 'playlist_option', emoji: '⏩'},
        {label: 'Shuffle Playlist', description: 'Select playlist and shuffle', value: 'shuffle_option', emoji: '🔀'},
        {label: 'YouTube', description: 'Search on YouTube', value: 'youtube_option', emoji: '🔍'},
        {label: 'Cancel', value: 'cancel_option', emoji: '❌'}
    ];
    let hasHistoryField = false;
    const index = Number(query) - 1;
    if(Number(query) && typeof player?.queueHistory[index] !== 'undefined') {
        hasHistoryField = true;
        fields.unshift({
            name: `play ${player.queueHistory[index].title}`,
            description: 'Play last song',
            value: 'previous_song_option',
            emoji: '🔙'
        });
    }
    const row = new MessageActionRow().addComponents(new MessageSelectMenu()
        .setCustomId('1')
        .setPlaceholder('Please select an option')
        .addOptions(fields));
    const clarificationOptions = await message.channel.send({content: 'Clarify Please', components: [row]});
    const clarificationCollector = clarificationOptions.createMessageComponentCollector({componentType: 'SELECT_MENU', time: options.MaxResponseTime * 1000});

    clarificationCollector.on('end', () => {
        if(clarificationOptions) { clarificationOptions.delete().catch(console.error); }
    });

    clarificationCollector.on('collect', async(i) => {
        if(i.user.id !== interaction.user.id) {
            i.reply({content: `This element is not for you!`, ephemeral: true});
            return;
        }
        clarificationCollector.stop();
        const value = i.values[0];

        switch(value) {
            case'previous_song_option':
                if(!hasHistoryField) break;
                if(player?.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
                    player?.queue.unshift(player.queueHistory[index]);
                    void handleSubscription(player?.queue, interaction, player);
                    break;
                }
                if(nextFlag || jumpFlag) {
                    player?.queue.unshift(player.queueHistory[index]);
                    if(jumpFlag && player?.audioPlayer.state.status == AudioPlayerStatus.Playing) {
                        player.loopSong = false;
                        player?.audioPlayer.stop();
                    }
                } else {
                    player?.queue.push(player?.queueHistory[index]);
                }
                player.commandLock = false;
                void interaction.followUp(`'${player?.queueHistory[index].title}' was added to queue!`);
                break;
                // 1: Play the saved playlist
            case'playlist_option':
                playlistsArray[playlistsArray.indexOf(found)].urls.map((song) => player?.queue.push(song));
                player.commandLock = false;
                await interaction.followUp('Added playlist to queue');
                if(player?.audioPlayer.state.status === AudioPlayerStatus.Playing) {
                    // Send a message indicating that the playlist was added to the queue
                    // interactiveEmbed(interaction)
                    //   .addField(
                    //     'Added Playlist',
                    //     `:new: **${query}** added ${
                    //       playlistsArray[playlistsArray.indexOf(found)].urls
                    //         .length
                    //     } songs to the queue!`
                    //   )
                    //   .build();
                } else {
                    void handleSubscription(player?.queue, interaction, player);
                }
                break;
                // 2: Play the shuffled saved playlist
            case'shuffle_option':
                shuffleArray(playlistsArray[playlistsArray.indexOf(found)].urls).map((song) => player?.queue.push(song));

                if(player?.audioPlayer.state.status === AudioPlayerStatus.Playing) {
                    // Send a message indicating that the playlist was added to the queue
                    // interactiveEmbed(interaction)
                    //   .addField(
                    //     'Added Playlist',
                    //     `:new: **${query}** added ${
                    //       playlistsArray[playlistsArray.indexOf(found)].urls
                    //         .length
                    //     } songs to the queue!`
                    //   )
                    //   .build();
                } else {
                    void handleSubscription(player?.queue, interaction, player);
                }
                break;
                // 3: Search for the query on YouTube
            case'youtube_option':
                await searchYoutube(interaction, interaction.member.voice.channel);
                break;
                // 4: Cancel
            case'cancel_option':
                player.commandLock = false;
                void interaction.followUp('Canceled search');
                deletePlayerIfNeeded(interaction);
                break;
        }
    });
};

export const name = 'play';
export const description = 'Play any song or playlist from YouTube or Spotify!';

export const options2 = [
    {name: 'query', description: ':notes: What song or playlist would you like to listen to? Add -s to shuffle a playlist', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options2[0]));

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message | void> => {
    if(!interaction.client.guildData.get(interaction.guildId)) {
        interaction.client.guildData.set(interaction.guildId, createGuildData());
    }
    const message = await interaction.deferReply({fetchReply: true});
    // Make sure that only users present in a voice channel can use 'play'
    if(!interaction.member.voice.channel) {
        return interaction.followUp(':no_entry: Please join a voice channel and try again!');
    }
    // Make sure there isn't a 'music-trivia' running
    if(interaction.client.guildData.get(interaction.guild.id)?.triviaData.isTriviaRunning) {
        return interaction.followUp(':x: Please try after the trivia has ended!');
    }
    const query = `${interaction.options.get('query')?.value}`;
    //Parse query to check for flags
    const splitQuery = query.split(' ');
    const flags = ['s', 'r', 'n', 'j'].map((f) => `-${f}`);
    if(flags.includes(splitQuery[splitQuery.length - 1])) splitQuery.pop();
    const cleanQuery = splitQuery.join(' ');

    let player = interaction.client.playerManager.get(interaction.guildId);

    if(!player) {
        player = new Player();
        interaction.client.playerManager.set(interaction.guildId, player);
    }

    if(player?.commandLock) {
        return interaction.followUp('Please wait until the last play call is processed');
    }

    player.commandLock = true;

    // Check if the query is actually a saved playlist name

    const userData = await Member.findOne({memberId: interaction.member.id}).exec(); // Object

    if(userData !== null) {
        const playlistsArray = userData.savedPlaylists;
        const found = playlistsArray.find((playlist) => playlist.name === cleanQuery);
        // Found a playlist with a name matching the query and it's not empty
        if(found && playlistsArray[playlistsArray.indexOf(found)].urls.length) {
            return handlePlayPlaylist(interaction, message, playlistsArray, found);
        }
    }

    // check if the user wants to play a song from the history queue
    if(Number(cleanQuery)) { return handlePlayFromHistory(interaction, message); }
    if(isSpotifyURL(cleanQuery)) { return handleSpotifyURL(interaction); }
    if(isYouTubePlaylistURL(cleanQuery)) { return handleYoutubePlaylistURL(interaction); }
    if(isYouTubeVideoURL(cleanQuery)) { return handleYoutubeURL(interaction); }

    // If user provided a song/video name
    await searchYoutube(interaction, interaction.member.voice.channel);
};

