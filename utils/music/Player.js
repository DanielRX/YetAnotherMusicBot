const {AudioPlayerStatus, createAudioPlayer, entersState, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioResource, StreamType} = require('@discordjs/voice');
const {setTimeout} = require('timers');
const {promisify} = require('util');
const ytdl = require('ytdl-core');
const {MessageEmbed} = require('discord.js');
const wait = promisify(setTimeout);

class MusicPlayer {
    constructor() {
        /**
         * @type {import('@discordjs/voice').VoiceConnection}
         */
        this.connection = null;
        /** @type {import('@discordjs/voice').AudioPlayer} */
        this.audioPlayer = createAudioPlayer();
        /** @type {import('../..').PlayTrack[]} */
        this.queue = [];
        this.skipTimer = false;
        this.loopSong = false;
        this.loopQueue = false;
        this.volume = 1;
        this.commandLock = false;
        /** @type {import('discord.js').BaseGuildTextChannel} */
        this.textChannel = null;
    }

    /** @returns {import('../..').PlayTrack[]} */
    getQueueHistory() {
        // eslint-disable-next-line
        return this.textChannel.client.guildData.get(this.textChannel.guildId).queueHistory;
    }

    /**
     * @param {import('@discordjs/voice').VoiceConnection} connection
     */
    passConnection(connection) {
        this.connection = connection;
        this.connection.on('stateChange', async(_, newState) => {
            if(newState.status === VoiceConnectionStatus.Disconnected) {
                if(newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    try {
                        await entersState(this.connection, VoiceConnectionStatus.Connecting, 5000);
                    } catch{
                        this.connection.destroy();
                    }
                } else if(this.connection.rejoinAttemps < 5) {
                    await wait((this.connection.rejoinAttemps + 1) * 5000);
                    this.connection.rejoin();
                } else {
                    this.connection.destroy();
                }
            } else if(newState.status === VoiceConnectionStatus.Destroyed) {
                // when leaving
                if(this.nowPlaying !== null) {
                    this.getQueueHistory().unshift(this.nowPlaying);
                }
                this.stop();
            } else if(newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling) {
                try {
                    await entersState(this.connection, VoiceConnectionStatus.Ready, 20000);
                } catch{
                    if(this.connection.state.status !== VoiceConnectionStatus.Destroyed)
                        this.connection.destroy();
                }
            }
        });

        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if(newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                if(this.loopSong) {
                    this.queue.unshift(this.nowPlaying);
                    void this.process(this.queue);
                } else if(this.loopQueue) {
                    this.queue.push(this.nowPlaying);
                    void this.process(this.queue);
                } else {
                    if(this.nowPlaying !== null) {
                        this.getQueueHistory().unshift(this.nowPlaying);
                    }
                    // Finished playing audio
                    if(this.queue.length) {
                        void this.process(this.queue);
                    } else {
                        // leave channel close connection and subscription
                        /* eslint-disable */
                        if(this.connection._state.status !== 'destroyed') {
                            this.connection.destroy();
                            this.textChannel.client.triviaManager.delete(this.textChannel.guildId);
                        }
                        /* eslint-enable */
                    }
                }
            } else if(newState.status === AudioPlayerStatus.Playing) {
                const queueHistory = this.getQueueHistory();
                const playingEmbed = new MessageEmbed()
                    .setThumbnail(this.nowPlaying.thumbnail)
                    .setTitle(this.nowPlaying.title)
                    .setColor('#ff0000')
                    .addField('Duration', ':stopwatch: ' + this.nowPlaying.duration, true)
                    .setFooter(`Requested by ${this.nowPlaying.memberDisplayName}!`, this.nowPlaying.memberAvatar);
                if(queueHistory.length) {
                    playingEmbed.addField('Previous Song', queueHistory[0].title, true);
                }
                void this.textChannel.send({embeds: [playingEmbed]});
            }
        });

        this.audioPlayer.on('error', (error) => { console.error(error); });
        this.connection.subscribe(this.audioPlayer);
    }

    stop() {
        this.queue.length = 0;
        this.nowPlaying = null;
        this.skipTimer = false;
        this.isPreviousTrack = false;
        this.loopSong = false;
        this.loopQueue = false;
        this.audioPlayer.stop(true);
    }

    /**
     * @param {import('../..').PlayTrack[]} queue
     * @returns {Promise<void>}
     */
    async process(queue) {
        if(this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) { return; }

        const song = this.queue.shift();
        this.nowPlaying = song;
        if(this.commandLock) this.commandLock = false;
        try {
            //const resource = await this.createAudioResource(song.url);
            const stream = ytdl(song.url, {filter: 'audio', quality: 'highestaudio', highWaterMark: 1 << 25});
            const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});
            this.audioPlayer.play(resource);
        } catch(err) {
            console.error(err);
            return this.process(queue);
        }
    }
}

module.exports = MusicPlayer;
