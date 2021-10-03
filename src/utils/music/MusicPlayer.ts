import type {VoiceConnection} from '@discordjs/voice';
import {AudioPlayerStatus, entersState, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioResource, StreamType} from '@discordjs/voice';
import {setTimeout} from 'timers';
import {promisify} from 'util';
import ytdl from 'ytdl-core';
import type {BaseGuildTextChannel} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import type {PlayTrack} from '../types';
import {guildData, triviaManager} from '../client';
import {logger} from '../logging';
import {Player} from './Player';

const wait = promisify(setTimeout);

class MusicPlayer extends Player {
    public commandLock = false;
    public queue: PlayTrack[] = [];
    public textChannel: BaseGuildTextChannel = null!;
    public loopSong = false;
    private readonly volume = 1;
    private loopQueue = false;
    private skipTimer = false;
    private isPreviousTrack = false;
    private nowPlaying: PlayTrack | null = null;

    public constructor() {
        super();
    }

    public getQueueHistory(): PlayTrack[] {
        // eslint-disable-next-line
        return guildData.get(this.textChannel.guildId)?.queueHistory!;
    }

    public passConnection(connection: VoiceConnection): void {
        super.passConnection(connection);
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if(newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                if(this.loopSong) {
                    if(this.nowPlaying !== null) {
                        this.queue.unshift(this.nowPlaying);
                    }
                    return this.process(this.queue);
                }
                if(this.loopQueue) {
                    if(this.nowPlaying !== null) {
                        this.queue.push(this.nowPlaying);
                    }
                    return this.process(this.queue);
                }
                if(this.nowPlaying !== null) { this.getQueueHistory().unshift(this.nowPlaying); }
                // Finished playing audio
                if(this.queue.length) {
                    return this.process(this.queue);
                }
                // leave channel close connection and subscription
                /* eslint-disable */
                if((this.connection as any)._state.status !== 'destroyed') {
                    this.connection.destroy();
                    triviaManager.delete(this.textChannel.guildId);
                }
                return;
                /* eslint-enable */
            }
            if(newState.status === AudioPlayerStatus.Playing) {
                if(!this.nowPlaying) { return; }
                const queueHistory = this.getQueueHistory();
                const playingEmbed = new MessageEmbed()
                    .setThumbnail(this.nowPlaying.thumbnail)
                    .setTitle(this.nowPlaying.name)
                    .setColor('#ff0000')
                    .addField('Duration', `:stopwatch: ${this.nowPlaying.duration}`, true)
                    .setFooter(`Requested by ${this.nowPlaying.memberDisplayName}!`, this.nowPlaying.memberAvatar);
                if(queueHistory.length) {
                    playingEmbed.addField('Previous Song', queueHistory[0].name, true);
                }
                void this.textChannel.send({embeds: [playingEmbed]});
            }
        });
    }

    public stop(): void {
        if(this.nowPlaying !== null) {
            this.getQueueHistory().unshift(this.nowPlaying);
        }
        this.nowPlaying = null!;
        this.skipTimer = false;
        this.isPreviousTrack = false;
        this.loopSong = false;
        this.loopQueue = false;
        super.stop();
    }

    public async process(queue: PlayTrack[]): Promise<void> {
        if(this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) { return; }

        const song = this.queue.shift() as unknown as PlayTrack;
        this.nowPlaying = song;
        if(this.commandLock) this.commandLock = false;
        try {
            //const resource = await this.createAudioResource(song.url);
            const stream = ytdl(song.url || '', {filter: 'audio', quality: 'highestaudio', highWaterMark: 1 << 25});
            const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});
            this.audioPlayer.play(resource);
        } catch(e: unknown) {
            logger.error(e);
            return this.process(queue);
        }
    }
}

export default MusicPlayer;
