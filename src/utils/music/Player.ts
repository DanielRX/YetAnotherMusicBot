import type {AudioPlayer, VoiceConnection, VoiceConnectionState} from '@discordjs/voice';
import {VoiceConnectionDisconnectReason, entersState, VoiceConnectionStatus, createAudioPlayer} from '@discordjs/voice';
import type {BaseGuildTextChannel} from 'discord.js';
import type {PlayTrack} from '../types';
import {promisify} from 'util';
import {logger} from '../logging';

const rejoinTimeout = 5000;
const wait = promisify(setTimeout);

export class Player { // TODO: Merge with TriviaPlayer
    public connection: VoiceConnection = null!;
    public queue: PlayTrack[] = [];
    public textChannel: BaseGuildTextChannel = null!;
    public readonly audioPlayer: AudioPlayer;

    public constructor() {
        this.audioPlayer = createAudioPlayer();
    }

    public passConnection(connection: VoiceConnection): void {
        this.connection = connection;
        this.connection.on('stateChange', async(_, state) => this.onConnectionStateChange(state));
        this.audioPlayer.on('error', (e) => { logger.error(e); });

        this.connection.subscribe(this.audioPlayer);
    }

    public stop(): void {
        this.queue.length = 0;
        this.audioPlayer.stop(true);
    }

    protected async onConnectionStateChange(state: VoiceConnectionState): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch(state.status) {
            case VoiceConnectionStatus.Disconnected: {
                if(state.reason === VoiceConnectionDisconnectReason.WebSocketClose && state.closeCode === 4014) {
                    try {
                        await entersState(this.connection, VoiceConnectionStatus.Connecting, rejoinTimeout);
                    } catch(e: unknown) {
                        this.connection.destroy();
                    }
                } else if(this.connection.rejoinAttempts < 5) {
                    await wait((this.connection.rejoinAttempts + 1) * rejoinTimeout);
                    this.connection.rejoin();
                } else {
                    this.connection.destroy();
                }
                break;
            }
            case VoiceConnectionStatus.Destroyed: {
                // when leaving
                this.stop();
                break;
            }
            case VoiceConnectionStatus.Connecting:
            case VoiceConnectionStatus.Signalling: {
                try {
                    await entersState(this.connection, VoiceConnectionStatus.Ready, 20000);
                } catch(e: unknown) {
                    logger.error(e);
                    if(this.connection.state.status !== VoiceConnectionStatus.Destroyed) { this.connection.destroy(); }
                }
            }
        }
    }
}

