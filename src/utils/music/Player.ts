import type {AudioPlayer, VoiceConnection} from '@discordjs/voice';

import {AudioPlayerStatus, createAudioPlayer, entersState, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioResource, StreamType} from '@discordjs/voice';
import {setTimeout} from 'timers';
import {promisify} from 'util';
import ytdl from 'ytdl-core';
import type {BaseGuildTextChannel} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import type {CustomClient, PlayTrack} from '../types';
const wait = promisify(setTimeout);

class MusicPlayer {
    public commandLock = false;
    public connection: VoiceConnection = null!;
    public queue: PlayTrack[] = [];
    public textChannel: BaseGuildTextChannel = null!;
    public loopSong = false;
    public readonly audioPlayer: AudioPlayer;
    private readonly volume = 1;
    private loopQueue = false;
    private skipTimer = false;
    private isPreviousTrack = false;
    private nowPlaying: PlayTrack = null!;

    constructor() {
        this.audioPlayer = createAudioPlayer();
    }

    getQueueHistory(): PlayTrack[] {
        // eslint-disable-next-line
        return (this.textChannel.client as unknown as CustomClient).guildData.get(this.textChannel.guildId)?.queueHistory!;
    }

    passConnection(connection: VoiceConnection): void {
        this.connection = connection;
        this.connection.on('stateChange', async(_, newState) => {
            // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
            switch(newState.status) {
                case VoiceConnectionStatus.Disconnected: {
                    if(newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                        try {
                            await entersState(this.connection, VoiceConnectionStatus.Connecting, 5000);
                        } catch(e: unknown) {
                            console.error(e);
                            this.connection.destroy();
                        }
                    } else if(this.connection.rejoinAttempts < 5) {
                        await wait((this.connection.rejoinAttempts + 1) * 5000);
                        this.connection.rejoin();
                    } else {
                        this.connection.destroy();
                    }
                    return;
                }
                case VoiceConnectionStatus.Destroyed: {
                // when leaving
                    if(this.nowPlaying !== null) {
                        this.getQueueHistory().unshift(this.nowPlaying);
                    }
                    this.stop();
                    break;
                }
                case VoiceConnectionStatus.Connecting:
                case VoiceConnectionStatus.Signalling: {
                    try {
                        await entersState(this.connection, VoiceConnectionStatus.Ready, 20000);
                    } catch(e: unknown) {
                        console.error(e);
                        if(this.connection.state.status !== VoiceConnectionStatus.Destroyed) { this.connection.destroy(); }
                    }
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
                        if((this.connection as any)._state.status !== 'destroyed') {
                            this.connection.destroy();
                            (this.textChannel.client as unknown as CustomClient).triviaManager.delete(this.textChannel.guildId);
                        }
                        /* eslint-enable */
                    }
                }
            } else if(newState.status === AudioPlayerStatus.Playing) {
                const queueHistory = this.getQueueHistory();
                const playingEmbed = new MessageEmbed()
                    .setThumbnail(this.nowPlaying.thumbnail)
                    .setTitle(this.nowPlaying.name)
                    .setColor('#ff0000')
                    .addField('Duration', ':stopwatch: ' + this.nowPlaying.duration, true)
                    .setFooter(`Requested by ${this.nowPlaying.memberDisplayName}!`, this.nowPlaying.memberAvatar);
                if(queueHistory.length) {
                    playingEmbed.addField('Previous Song', queueHistory[0].name, true);
                }
                void this.textChannel.send({embeds: [playingEmbed]});
            }
        });

        this.audioPlayer.on('error', (error) => { console.error(error); });
        this.connection.subscribe(this.audioPlayer);
    }

    stop(): void {
        this.queue.length = 0;
        this.nowPlaying = null!;
        this.skipTimer = false;
        this.isPreviousTrack = false;
        this.loopSong = false;
        this.loopQueue = false;
        this.audioPlayer.stop(true);
    }

    async process(queue: PlayTrack[]): Promise<void> {
        if(this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) { return; }

        const song = this.queue.shift() as unknown as PlayTrack;
        this.nowPlaying = song;
        if(this.commandLock) this.commandLock = false;
        try {
            //const resource = await this.createAudioResource(song.url);
            const stream = ytdl(song?.url || '', {filter: 'audio', quality: 'highestaudio', highWaterMark: 1 << 25});
            const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});
            this.audioPlayer.play(resource);
        } catch(e: unknown) {
            console.error(e);
            return this.process(queue);
        }
    }
}

export default MusicPlayer;
