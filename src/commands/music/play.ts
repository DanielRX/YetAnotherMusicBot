import type {BaseGuildTextChannel, Message, SelectMenuInteraction, User, VoiceChannel} from 'discord.js';
import type {Video} from 'youtube-sr';
import type MusicPlayer from '../../utils/music/MusicPlayer';
import type {CommandInput, CommandReturn, CustomAudioPlayer, CustomInteraction, GuildData, Playlist, PlayTrack, Track} from '../../utils/types';
import {MessageSelectMenu, MessageActionRow} from 'discord.js';
import Player from '../../utils/music/MusicPlayer';
import {getData} from 'spotify-url-info';
import YouTube from 'youtube-sr';
import member from '../../utils/models/Member';
import {joinVoiceChannel, entersState, VoiceConnectionStatus, AudioPlayerStatus} from '@discordjs/voice';
import createGuildData from '../../utils/createGuildData';
import {searchOne} from '../../utils/music/searchOne';
import {shuffleArray, isSpotifyURL, isYouTubeVideoURL, isYouTubePlaylistURL} from '../../utils/utils';
import {createSelectMenu, createHistoryRow} from '../../utils/music/play-utils';
import {logger} from '../../utils/logging';
import {options as opts} from '../../utils/options';
import {playerManager, guildData} from '../../utils/client';

const deletePlayerIfNeeded = (interaction: CustomInteraction) => {
    const player = playerManager.get(interaction.guildId);
    if(!player) { return; }
    if(!player.nowPlaying) { return; }
    return playerManager.delete(interaction.guildId);
};

const constructSongObj = (video: Video, voiceChannel: VoiceChannel, user: User, timestamp?: number): PlayTrack => {
    const {url, title, duration: rawDuration, durationFormatted, thumbnail} = video;
    let duration = durationFormatted;
    if(duration === '00:00') duration = 'Live Stream';
    // checks if the user searched for a song using a Spotify URL
    return {url, name: `${title}`, rawDuration, duration, timestamp: `${timestamp}`, thumbnail: thumbnail?.url ?? '', voiceChannel, memberDisplayName: user.username, memberAvatar: user.avatarURL({format: 'webp', dynamic: false, size: 16}) ?? '', artists: []};
};

const handleSubscription = async(queue: PlayTrack[], interaction: CustomInteraction, player: MusicPlayer): Promise<CommandReturn> => {
    let voiceChannel = queue[0].voiceChannel;
    if(typeof voiceChannel === 'undefined') {
        // happens when loading a saved playlist
        voiceChannel = interaction.member.voice.channel as VoiceChannel;
    }

    const title = player.queue[0].name;
    let connection = player.connection;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if(connection == null) {
        connection = joinVoiceChannel({channelId: voiceChannel.id, guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator});
        connection.on('error', (e) => { logger.error(e); });
    }
    player.textChannel = interaction.channel as BaseGuildTextChannel;
    player.passConnection(connection);

    try {
        await entersState(player.connection, VoiceConnectionStatus.Ready, 10000);
    } catch(e: unknown) {
        player.commandLock = false;
        deletePlayerIfNeeded(interaction);
        logger.error(e);
        return {content: 'Failed to join your channel!'};
    }
    await player.process(player.queue);

    return `Enqueued ${title}`;
};

const flagLogic = (interaction: CustomInteraction, video: any, jumpFlag: boolean) => {
    const player = playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;
    player.queue.splice(0, 0, constructSongObj(video, interaction.member.voice.channel as VoiceChannel, interaction.member.user));
    if(jumpFlag && player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
        player.loopSong = false;
        player.audioPlayer.stop();
    }
};

const handleSpotifyPlaylistData = async(interaction: CustomInteraction, query: string, flags: string, data: any): Promise<CommandReturn> => {
    const player = playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;
    const spotifyPlaylistItems = data.tracks.items;
    const processingMessage = await interaction.channel?.send({content: 'Processing Playlist...'});
    for(const item of spotifyPlaylistItems) {
        const {artists, name, track} = item;
        try {
            const trackData = (data.type == 'album') ? {artists, name} : track;
            const video = await searchOne(trackData);
            if(flags.includes('n') || flags.includes('j')) {
                flagLogic(interaction, video, flags.includes('j'));
            } else {
                player.queue.push(constructSongObj(video, interaction.member.voice.channel as VoiceChannel, interaction.member.user));
            }
        } catch(e: unknown) {
            await processingMessage?.delete();
            return 'Failed to process playlist, please try again later';
        }
    }
    void processingMessage?.edit('Playlist Processed!');
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) { return handleSubscription(player.queue, interaction, player as unknown as MusicPlayer); }
    return 'UNREACHABLE';
};

const handleSpotifyURL = async(interaction: CustomInteraction, query: string, flags: string): Promise<CommandReturn> => {
    const player = playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;
    const handleSpotifyData = async(data: Track | {tracks: Track[]}) => {
        // 'tracks' property only exists on a playlist data object
        if('tracks' in data) {
            // handle playlist
            return handleSpotifyPlaylistData(interaction, query, flags, data);
        }
        // single track

        try {
            const video = await searchOne(data);
            if(flags.includes('n') || flags.includes('j')) {
                flagLogic(interaction, video, flags.includes('j'));
            } else {
                player.queue.push(constructSongObj(video, interaction.member.voice.channel as VoiceChannel, interaction.member.user));
                if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
                    await handleSubscription(player.queue, interaction, player as unknown as MusicPlayer); return;
                }
                return `Added **${video.title}** to queue`;
            }
        } catch(e: unknown) {
            logger.error(e);
            return 'Unable to add song to queue';
        }
        return '';
    };

    try {
        const data = getData(query);
        const output = await handleSpotifyData(data);
        player.commandLock = false;
        return output ?? '';
    } catch(e: unknown) {
        deletePlayerIfNeeded(interaction);
        logger.error(e);
        return `I couldn't find what you were looking for :(`;
    }
};

const searchYoutube = async(interaction: CustomInteraction, query: string, flags: string, voiceChannel: VoiceChannel): Promise<CommandReturn> => {
    const player = playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;
    const videos = await YouTube.search(query, {limit: 5, type: 'video'}).catch(() => ':x: There was a problem searching the video you requested!');
    if(typeof videos === 'string') { return videos; }
    if(typeof videos === 'undefined') {
        player.commandLock = false;
        return `:x: I had some trouble finding what you were looking for, please try again or be more specific.`;
    }
    if(videos.length < 5) {
        player.commandLock = false;
        return `:x: I had some trouble finding what you were looking for, please try again or be more specific.`;
    }
    const vidNameArr = [...videos.map((video) => video.title?.slice(0, 99) ?? ''), 'cancel'];
    const row = createSelectMenu(vidNameArr);
    const playOptions = await interaction.channel?.send({content: 'Pick a video', components: [row]});
    const playOptionsCollector = playOptions?.createMessageComponentCollector({componentType: 'SELECT_MENU', time: opts.maxResponseTime * 1000});
    playOptionsCollector?.on('end', async() => {
        if(playOptions) {
            await playOptions.delete().catch(logger.error);
        }
    });

    const handleYoutubeData = async(video: Video): Promise<CommandReturn> => {
        const player2 = playerManager.get(interaction.guildId) as unknown as MusicPlayer;
        if(video.live && !opts.playLiveStreams) {
            if(playOptions) {
                playOptions.delete().catch(logger.error);
            }
            return 'Live streams are disabled in this server! Contact the owner';
        }

        if(video.duration > 60 * 60 * 1000 && !opts.playVideosLongerThan1Hour) {
            if(playOptions) {
                playOptions.delete().catch(logger.error);
            }
            return 'Videos longer than 1 hour are disabled in this server! Contact the owner';
        }

        if(player2.queue.length > opts.maxQueueLength) {
            if(playOptions) { playOptions.delete().catch(logger.error); }
            return `The queue hit its limit of ${opts.maxQueueLength}, please wait a bit before attempting to add more songs`;
        }
        const audioPlayer = player2.audioPlayer;
        if(flags.includes('n') || flags.includes('j')) {
            player2.queue.unshift(constructSongObj(video, voiceChannel, interaction.member.user));
            if(flags.includes('j') && audioPlayer.state.status === AudioPlayerStatus.Playing) {
                player2.loopSong = false;
                audioPlayer.stop();
                return 'Skipped song!';
            }
        } else {
            player2.queue.push(constructSongObj(video, voiceChannel, interaction.member.user));
        }
        if(audioPlayer.state.status !== AudioPlayerStatus.Playing) {
            const newPlayer = player2;
            return handleSubscription(newPlayer.queue, interaction, newPlayer);
        }
        return `Added **${video.title}** to queue`;
    };

    const value = await new Promise<string>((resolve) => {
        playOptionsCollector?.on('collect', async(i: SelectMenuInteraction) => {
            if(i.user.id !== interaction.user.id) {
                return i.reply({content: 'This element is not for you!', ephemeral: true});
            }
            playOptionsCollector.stop();
            resolve(i.values[0]);
        });
    });
    if(value === 'cancel_option') {
        if(playOptions) {
            player.commandLock = false;
            return 'Search canceled';
        }
    }
    const videoIndex = parseInt(value);
    try {
        const data = await YouTube.getVideo(`https://www.youtube.com/watch?v=${videos[videoIndex - 1].id}`);
        const output = handleYoutubeData(data);
        player.commandLock = false;
        return output;
    } catch(e: unknown) {
        player.commandLock = false;
        deletePlayerIfNeeded(interaction);
        if(playOptions) playOptions.delete().catch(logger.error);
        logger.error(e);
        return 'An error has occurred while trying to get the video ID from youtube.';
    }
};

const handleYoutubeURL = async(interaction: CustomInteraction, query: string, flags: string): Promise<CommandReturn> => {
    const player = playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;
    const timestampRegex = /t=([^#&\n\r]+)/g;
    const timestampArr = timestampRegex.exec(query);
    let timestamp = 0;
    if(timestampArr) {
        let timestampLocal = timestampArr[1];
        if(timestampLocal.endsWith('s')) {
            timestampLocal = timestampLocal.substring(0, timestampLocal.indexOf('s'));
        }
        if(!Number(timestampLocal)) {
            timestamp = 0;
        } else {
            timestamp = Number(timestampLocal);
        }
    }

    const video = await YouTube.getVideo(query).catch(function() {
        deletePlayerIfNeeded(interaction);
        return ':x: There was a problem getting the video you provided!';
    });
    if(typeof video === 'string') { return video; }
    if(video.live && !opts.playLiveStreams) {
        deletePlayerIfNeeded(interaction);
        return 'Live streams are disabled in this server! Contact the owner';
    }

    if(video.duration > 60 * 60 * 1000 && !opts.playVideosLongerThan1Hour) {
        deletePlayerIfNeeded(interaction);
        return 'Videos longer than 1 hour are disabled in this server! Contact the owner';
    }

    if(player.length > opts.maxQueueLength) {
        player.commandLock = false;
        return `The queue hit its limit of ${opts.maxQueueLength}, please wait a bit before attempting to play more songs`;
    }
    if(flags.includes('n') || flags.includes('j')) {
        flagLogic(interaction, video, flags.includes('j'));
    } else {
        player.queue.push(constructSongObj(video, interaction.member.voice.channel as VoiceChannel, interaction.member.user, timestamp));
    }

    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        return handleSubscription(player.queue, interaction, player as unknown as MusicPlayer);
    }
    return `Enqueued ${video.title}`;
};

const handleYoutubePlaylistURL = async(interaction: CustomInteraction, query: string, flags: string): Promise<CommandReturn> => {
    const player = playerManager.get(interaction.guildId) as unknown as CustomAudioPlayer;

    const playlist = await YouTube.getPlaylist(query);
    if(typeof playlist === 'undefined') {
        deletePlayerIfNeeded(interaction);
        return ':x: Playlist is either private or it does not exist!';
    }

    const videos = await playlist.fetch();
    if(typeof videos === 'undefined') {
        player.commandLock = false;
        deletePlayerIfNeeded(interaction);
        return ":x: I hit a problem when trying to fetch the playlist's videos";
    }
    let videosArr = videos.videos;

    if(opts.automaticallyShuffleYouTubePlaylists || flags.includes('s')) {
        videosArr = shuffleArray(videosArr);
    }

    if(flags.includes('r')) { videosArr = videosArr.reverse(); }

    if(player.queue.length >= opts.maxQueueLength) {
        player.commandLock = false;
        return 'The queue is full, please try adding more songs later';
    }
    videosArr = videosArr.splice(0, opts.maxQueueLength - player.queue.length);

    //variable to know how many songs were skipped because of privacyStatus
    let skipAmount = 0;

    videosArr.forEach((video, key) => {
        // don't process private videos
        if(video.private) {
            skipAmount++;
            return;
        }
        if(flags.includes('n') || flags.includes('j')) {
            player.queue.splice(key - skipAmount, 0, constructSongObj(video, interaction.member.voice.channel as VoiceChannel, interaction.member.user));
        } else {
            player.queue.push(constructSongObj(video, interaction.member.voice.channel as VoiceChannel, interaction.member.user));
        }
    });
    if(flags.includes('j') && player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
        player.loopSong = false;
        player.audioPlayer.stop();
    }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        return handleSubscription(player.queue, interaction, player as unknown as MusicPlayer);
    }
    // interactiveEmbed(interaction)
    //   .addField('Added Playlist', `[${playlist.title}](${playlist.url})`)
    //   .build();
    player.commandLock = false;
    return 'Added playlist to queue!';
};

const handlePlayFromHistory = async(interaction: CustomInteraction, query: string, flags: string, message: Message): Promise<CommandReturn> => {
    const player = playerManager.get(interaction.guildId);
    const index = Number(query) - 1;
    // continue if there's no index matching the query on the history queue
    if(typeof player?.queueHistory[index] === 'undefined') { return 'MISSING_ERROR_MSG'; }
    const row = createHistoryRow(query);
    const clarificationOptions = await message.channel.send({
        content: 'Did you mean to play a song from the history queue?',
        components: [row]
    });
    const clarificationCollector = clarificationOptions.createMessageComponentCollector({
        componentType: 'SELECT_MENU',
        time: opts.maxResponseTime * 1000
    });
    return new Promise((resolve) => {
        clarificationCollector.on('collect', async(i: SelectMenuInteraction) => {
            if(i.user.id !== interaction.user.id) {
                void i.reply({content: `This element is not for you!`, ephemeral: true});
                return;
            }
            clarificationCollector.stop();
            const value = i.values[0];

            switch(value) {
            // 1: Play a song from the history queue
                case 'history_option':
                    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
                        player.queue.unshift(player.queueHistory[index]);
                        return resolve(handleSubscription(player.queue, interaction, player as unknown as MusicPlayer));
                    }
                    if(flags.includes('n') || flags.includes('j')) {
                        player.queue.unshift(player.queueHistory[index]);
                        if(flags.includes('j')) { // && player.audioPlayer.state.status === AudioPlayerStatus.Playing
                            player.loopSong = false;
                            player.audioPlayer.stop();
                        }
                    } else {
                        player.queue.push(player.queueHistory[index]);
                    }
                    player.commandLock = false;
                    return resolve(`'${player.queueHistory[index].name}' was added to queue!`);
                // 2: Search for the query on YouTube
                case 'youtube_option':
                    return resolve(searchYoutube(interaction, query, flags, interaction.member.voice.channel as VoiceChannel));
                // 3: Cancel
                case 'cancel_option':
                    deletePlayerIfNeeded(interaction);
                    return resolve('Canceled search');
            }
        });
    });
};

const playPlaylistFields = [
    {label: 'Playlist', description: 'Select playlist', value: 'playlist_option', emoji: '⏩'},
    {label: 'Shuffle Playlist', description: 'Select playlist and shuffle', value: 'shuffle_option', emoji: '🔀'},
    {label: 'YouTube', description: 'Search on YouTube', value: 'youtube_option', emoji: '🔍'},
    {label: 'Cancel', value: 'cancel_option', emoji: '❌'}
];

const handlePlayPlaylist = async(interaction: CustomInteraction, query: string, flags: string, message: Message, playlistsArray: Playlist[], found: Playlist): Promise<CommandReturn> => {
    const player = playerManager.get(interaction.guildId) as unknown as MusicPlayer;
    const fields = [...playPlaylistFields];
    let hasHistoryField = false;
    const index = Number(query) - 1;
    if(Number(query) && typeof player.getQueueHistory()[index] !== 'undefined') {
        hasHistoryField = true;
        fields.unshift({
            label: `play ${player.getQueueHistory()[index].name}`,
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
    const clarificationCollector = clarificationOptions.createMessageComponentCollector({componentType: 'SELECT_MENU', time: opts.maxResponseTime * 1000});

    clarificationCollector.on('end', () => {
        if(typeof clarificationOptions !== 'undefined') { clarificationOptions.delete().catch(logger.error); }
    });
    return new Promise((resolve) => {
        clarificationCollector.on('collect', async(i: SelectMenuInteraction): Promise<void> => {
            if(i.user.id !== interaction.user.id) {
                return i.reply({content: `This element is not for you!`, ephemeral: true});
            }
            clarificationCollector.stop();
            const value = i.values[0];

            switch(value) {
                case 'previous_song_option':
                    if(!hasHistoryField) break;
                    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
                        player.queue.unshift(player.getQueueHistory()[index]);
                        return resolve(handleSubscription(player.queue, interaction, player));
                    }
                    if(flags.includes('n') || flags.includes('j')) {
                        player.queue.unshift(player.getQueueHistory()[index]);
                        if(flags.includes('j')) { // && player.audioPlayer.state.status === AudioPlayerStatus.Playing
                            player.loopSong = false;
                            player.audioPlayer.stop();
                        }
                    } else {
                        player.queue.push(player.getQueueHistory()[index]);
                    }
                    player.commandLock = false;
                    return resolve(`'${player.getQueueHistory()[index].name}' was added to queue!`);
                // 1: Play the saved playlist
                case 'playlist_option':
                    playlistsArray[playlistsArray.indexOf(found)].urls.map((song) => player.queue.push(song));
                    player.commandLock = false;
                    resolve('Added playlist to queue');
                    if(player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
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
                        void handleSubscription(player.queue, interaction, player); // Ignoring the first song message
                    }
                    break;
                // 2: Play the shuffled saved playlist
                case 'shuffle_option':
                    shuffleArray(playlistsArray[playlistsArray.indexOf(found)].urls).map((song) => player.queue.push(song));

                    if(player.audioPlayer.state.status === AudioPlayerStatus.Playing) {
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
                        void handleSubscription(player.queue, interaction, player);
                    }
                    break;
                // 3: Search for the query on YouTube
                case 'youtube_option':
                    return resolve(searchYoutube(interaction, query, flags, interaction.member.voice.channel as VoiceChannel));
                // 4: Cancel
                case 'cancel_option':
                    player.commandLock = false;
                    deletePlayerIfNeeded(interaction);
                    return resolve('Canceled search');
            }
        });
    });
};

export const name = 'play';
export const description = 'Play any song or playlist from YouTube or Spotify!';
export const deferred = false; // TODO: Fix this

export const options = [
    {type: 'string' as const, name: 'query', description: ':notes: What song or playlist would you like to listen to?', required: true, choices: []},
    {type: 'string' as const, name: 'flags', description: ':notes: Add s to shuffle a playlist, r to reverse it, n to play next, j to play now', required: false, choices: [], default: ''}
];

export const execute = async({interaction, guildId, messages, params: {rawQuery, flags}}: CommandInput<{rawQuery: string, flags: string}>): Promise<CommandReturn> => {
    if(!guildData.get(guildId)) {
        guildData.set(guildId, createGuildData());
    }
    const message = await interaction.deferReply({fetchReply: true});
    // Make sure that only users present in a voice channel can use 'play'
    if(!interaction.member.voice.channel) { return messages.NOT_IN_VC(); }
    // Make sure there isn't a 'music-trivia' running
    const guild = guildData.get(guildId) as unknown as GuildData;
    if(guild.triviaData.isTriviaRunning) { return messages.TRIVIA_IS_RUNNING(); }

    let player = playerManager.get(guildId) as unknown as MusicPlayer | undefined;

    if(!player) {
        player = new Player();
        playerManager.set(guildId, player as unknown as CustomAudioPlayer);
    }

    if(player.commandLock) { return messages.PLAY_CALL_RUNNING(); }

    player.commandLock = true;

    // Check if the query is actually a saved playlist name
    try {
        const userData = await member.findOne({memberId: interaction.member.id}).exec(); // Object

        if(userData !== null) {
            const playlistsArray = userData.savedPlaylists;
            const found = playlistsArray.find((playlist: Playlist) => playlist.name === rawQuery);
            // Found a playlist with a name matching the query and it's not empty
            if(found && playlistsArray[playlistsArray.indexOf(found)].urls.length) {
                return handlePlayPlaylist(interaction, rawQuery, flags, message, playlistsArray, found);
            }
        }

        // check if the user wants to play a song from the history queue
        if(Number(rawQuery)) { return handlePlayFromHistory(interaction, rawQuery, flags, message); }
        if(isSpotifyURL(rawQuery)) { return handleSpotifyURL(interaction, rawQuery, flags); }
        if(isYouTubePlaylistURL(rawQuery)) { return handleYoutubePlaylistURL(interaction, rawQuery, flags); }
        if(isYouTubeVideoURL(rawQuery)) {
            const output = handleYoutubeURL(interaction, rawQuery, flags);
            player.commandLock = false;
            return output;
        }

        // If user provided a song/video name
        const x = await searchYoutube(interaction, rawQuery, flags, interaction.member.voice.channel as VoiceChannel);
        player.commandLock = false;
        return x;
    } catch(e: Error) {
        logger.error(e);
        player.commandLock = false;
    }
};

