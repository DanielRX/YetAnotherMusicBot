import type {AudioPlayer, VoiceConnection} from '@discordjs/voice';
import type {BaseGuildTextChannel, Message} from 'discord.js';
import type {PlayTrack} from '../types';
import {AudioPlayerStatus, createAudioPlayer, entersState, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioResource, StreamType} from '@discordjs/voice';
import {setTimeout} from 'timers';
import {promisify} from 'util';
import {MessageEmbed} from 'discord.js';
import {triviaManager} from '../client';
import {logger} from '../../utils/logging';

const wait = promisify(setTimeout);

const capitalizeWords = (str: string) => {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const normalizeValue = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^0-9a-zA-Z\s]/g, '') // Remove non-alphanumeric characters
        .replace(/ - .*/g, '')
        .replace(/ \(.*\)/g, '')
        .replace(/ \[.*\]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase(); // Remove duplicate spaces

const getLeaderBoard = (arr: [string, number][]) => { // TODO: Shared medals
    if(typeof arr === 'undefined') { return; }
    if(typeof arr[0] === 'undefined') { return; } // Issue #422
    const players = arr.filter(([, points]) => points > 0);
    let leaderBoard = '';

    leaderBoard = `:first_place:  **${players[0][0]}:** ${players[0][1]}`;

    players.forEach(([player, score], i) => {
        leaderBoard += `\n\n   ${i + 1 === 2 ? ':second_place:' : i + 1 === 3 ? ':third_place:' : i + 1}: ${player}: ${score}`;
    });
    return leaderBoard;
};

const rejoinTimeout = 5000;

export class TriviaPlayer { // TODO: Merge with MusicPlayer
    public textChannel: BaseGuildTextChannel = null!;
    public readonly score: Map<string, number> = new Map();
    public queue: PlayTrack[] = [];
    public connection: VoiceConnection = null!;
    private wasTriviaEndCalled = false;
    private readonly audioPlayer: AudioPlayer;
    // eslint-disable-next-line @typescript-eslint/no-parameter-properties
    public constructor() {
        this.audioPlayer = createAudioPlayer();
    }

    public passConnection(connection: VoiceConnection): void {
        this.connection = connection;
        this.connection.on('stateChange', async(_, newState) => {
            if(newState.status === VoiceConnectionStatus.Disconnected) {
                if(newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
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
            } else if(newState.status === VoiceConnectionStatus.Destroyed) {
                // When destroying connection (stop-trivia)
                this.stop();
            } else if(newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling) {
                try {
                    await entersState(this.connection, VoiceConnectionStatus.Ready, 20000);
                } catch(e: unknown) {
                    logger.error(e);
                    if(this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        this.connection.destroy();
                    }
                }
            }
        });

        this.audioPlayer.on('stateChange', (oldState, newState) => {
            let nextHintInt: NodeJS.Timeout | undefined = undefined;
            if(newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                this.queue.shift();
                // Finished playing audio
                if(this.queue.length) {
                    // Play next song
                    void this.process(this.queue);
                } else {
                    const sortedScoreMap = new Map([...this.score.entries()].sort(function(a, b) {
                        return b[1] - a[1];
                    }));

                    if(this.wasTriviaEndCalled) { return; }
                    const board = getLeaderBoard(Array.from(sortedScoreMap.entries()));
                    if(typeof board !== 'undefined') {
                        const embed = new MessageEmbed()
                            .setColor('#ff7373')
                            .setTitle(`Music Quiz Results:`)
                            .setDescription(board);
                        void this.textChannel.send({embeds: [embed]});
                    }

                    // Leave channel close connection and subscription
                    /* eslint-disable */
                    if((this.connection as any)._state.status !== 'destroyed') {
                        this.connection.destroy();
                        triviaManager.delete(this.textChannel.guildId);
                    }
                    /* eslint-enable */
                }
            } else if(newState.status === AudioPlayerStatus.Playing) {
                // Trivia logic
                let songNameFoundTime = -1;
                const songNameWinners: {[key: string]: boolean} = {};
                const songSingerWinners: {[key: string]: boolean} = {};
                let songSingerFoundTime = -1;
                const answerTimeout = 1500;

                let lastMessage: Message | null = null;

                let skipCounter = 0;
                const skippedArray: string[] = [];
                let hints = 0;
                const timeForSong = 30000;
                const collector = this.textChannel.createMessageCollector({time: timeForSong});

                const convertToHint = (str: string, hintCount: number) => {
                    let out = '';
                    let i = 0;
                    for(const s of str) {
                        if(s != ' ') { i++; }
                        if(i <= hintCount || s === ' ') {
                            out += s;
                        } else {
                            out += '*';
                        }
                    }
                    return out;
                };

                const showHint = async(_singer: string, title: string, artists: string[]) => { // TODO: Skip the
                    // const singerHint = convertToHint(singer, hints);
                    const titleHint = convertToHint(title, hints);
                    const artistHints = artists.map((artist) => convertToHint(artist, hints));
                    const song = `\`${songNameFoundTime === -1 ? titleHint : title}\`\nBy:\n ${songSingerFoundTime === -1 ? artistHints.map((artist) => `\`${artist}\``).join('\n') : artists.map((artist) => `\`${artist}\``).join('\n')}`;
                    const embed = new MessageEmbed().setColor('#ff7373').setTitle(`The song is:`).setDescription(song);
                    if(lastMessage !== null) { lastMessage.delete().catch(() => { logger.error('Failed to delete message'); }); }
                    lastMessage = await this.textChannel.send({embeds: [embed]});
                    hints++;
                };
                // let timeoutId = setTimeout(() => collector.stop(), 30000);

                nextHintInt = setInterval(() => {
                    void showHint(normalizeValue((this.queue[0] ?? {artists: ['']}).artists[0]), normalizeValue((this.queue[0] ?? {name: ''}).name), (this.queue[0] ?? {artists: ['']}).artists.map(normalizeValue));
                }, 5000);

                void showHint(normalizeValue((this.queue[0] ?? {artists: ['']}).artists[0]), normalizeValue((this.queue[0] ?? {name: ''}).name), (this.queue[0] ?? {artists: ['']}).artists.map(normalizeValue));

                collector.on('collect', (msg: Message) => {
                    if(!this.score.has(msg.author.username)) { return; }
                    const time = Date.now();
                    const guess = normalizeValue(msg.content);
                    const title = normalizeValue(this.queue[0].name);
                    const singers = this.queue[0].artists.map(normalizeValue);

                    if(guess === 'skip') {
                        if(skippedArray.includes(msg.author.username)) { return; }
                        skippedArray.push(msg.author.username);
                        skipCounter++;
                        if(skipCounter > this.score.size * 0.6) { return collector.stop(); }
                        return;
                    }

                    if(msg.content.includes(':')) { return; }
                    const gotAnArtist = singers.some((artist) => guess.includes(artist));
                    const gotName = guess.includes(title);

                    if(!gotName && !gotAnArtist) { return void msg.react('❌'); }

                    let gotSingerInTime = false;
                    let gotNameInTime = false;

                    const firstSingerGuess = songSingerFoundTime === -1 && (gotAnArtist);
                    const firstNameGuess = songNameFoundTime === -1 && (gotName);

                    if(firstSingerGuess) { songSingerFoundTime = time; }
                    if((time - songSingerFoundTime) < answerTimeout) { gotSingerInTime = true; }
                    if(firstNameGuess) { songNameFoundTime = time; }
                    if((time - songNameFoundTime) < answerTimeout) { gotNameInTime = true; }

                    if(gotSingerInTime && !songSingerWinners[msg.author.username]) {
                        songSingerWinners[msg.author.username] = true;
                        this.score.set(msg.author.username, (this.score.get(msg.author.username) ?? 0) + 1);
                        void msg.react('☑');
                    }

                    if(gotNameInTime && !songNameWinners[msg.author.username]) {
                        songNameWinners[msg.author.username] = true;
                        this.score.set(msg.author.username, (this.score.get(msg.author.username) ?? 0) + 1);
                        void msg.react('☑');
                    }

                    if((songSingerFoundTime !== -1) && (songNameFoundTime !== -1)) { setTimeout(() => collector.stop(), 1000); }
                });

                collector.on('end', () => {
                    if(typeof nextHintInt !== 'undefined') {
                        clearTimeout(nextHintInt);
                    }
                    if(lastMessage !== null) { void lastMessage.delete().catch(() => { logger.error('Failed to delete message'); }); }
                    /*The reason for this if statement is that we don't want to get an empty embed returned via chat by the bot if end-trivia command was called */
                    if(this.wasTriviaEndCalled) {
                        this.wasTriviaEndCalled = false;
                        return;
                    }

                    this.audioPlayer.stop();

                    const sortedScoreMap = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));

                    const song = `${capitalizeWords(this.queue[0].artists[0])}: ${capitalizeWords(this.queue[0].name)}`;
                    const board = getLeaderBoard(Array.from(sortedScoreMap.entries()));
                    if(typeof board !== 'undefined') {
                        const embed = new MessageEmbed()
                            .setColor('#ff7373')
                            .setTitle(`:musical_note: The song was: (${Math.max(this.queue.length - 1, 0)} left)`)
                            .setDescription(`**[${song}](https://open.spotify.com/track/${(this.queue[0] as any).id})**\n\n${board}`);

                        void this.textChannel.send({embeds: [embed]});
                    }
                    return;
                });
            }
        });

        this.audioPlayer.on('error', (e) => { logger.error(e); });

        this.connection.subscribe(this.audioPlayer);
    }

    public stop(): void {
        this.queue.length = 0;
        this.audioPlayer.stop(true);
    }

    public reset(): void {
        this.queue.length = 0;
        this.wasTriviaEndCalled = true;
        this.score.clear();
        this.connection.destroy();
    }

    public async process(queue: PlayTrack[]): Promise<void> {
        const [song] = this.queue;
        try {
            const resource = createAudioResource(`${song.previewUrl}.mp3`, {inputType: StreamType.Arbitrary});
            this.audioPlayer.play(resource);
        } catch(e: unknown) {
            logger.error(e);
            return this.process(queue);
        }
    }
}

export default TriviaPlayer;
