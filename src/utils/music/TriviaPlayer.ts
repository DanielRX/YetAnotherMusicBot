import type {AudioPlayer, VoiceConnection} from '@discordjs/voice';
import type {BaseGuildTextChannel, Message} from 'discord.js';
import type {CustomClient, PlayTrack} from '../types';
import {AudioPlayerStatus, createAudioPlayer, entersState, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioResource, StreamType} from '@discordjs/voice';
import {setTimeout} from 'timers';
import {promisify} from 'util';
import ytdl from 'ytdl-core';
import {MessageEmbed} from 'discord.js';
const wait = promisify(setTimeout);

const capitalize_Words = (str: string) => {
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

const getLeaderBoard = (arr: [string, number][]) => {
    if(!arr) { return; }
    if(!arr[0]) { return; } // Issue #422
    let leaderBoard = '';

    leaderBoard = `👑   **${arr[0][0]}:** ${arr[0][1]}  points`;

    if(arr.length > 1) {
        for(let i = 1; i < arr.length; i++) {
            leaderBoard += `\n\n   ${i + 1}: ${arr[i][0]}: ${arr[i][1]}  points`;
        }
    }
    return leaderBoard;
};

export class TriviaPlayer {
    public textChannel: BaseGuildTextChannel = null!;
    public readonly score: Map<string, number> = new Map();
    public queue: PlayTrack[] = [];
    public connection: VoiceConnection = null!;
    private wasTriviaEndCalled = false;
    private readonly audioPlayer: AudioPlayer;
    // eslint-disable-next-line @typescript-eslint/no-parameter-properties
    constructor(public useYoutube = true) {
        this.audioPlayer = createAudioPlayer();
    }

    passConnection(connection: VoiceConnection): void {
        this.connection = connection;
        this.connection.on('stateChange', async(_, newState) => {
            if(newState.status === VoiceConnectionStatus.Disconnected) {
                if(newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    try {
                        await entersState(this.connection, VoiceConnectionStatus.Connecting, 5000);
                    } catch{
                        this.connection.destroy();
                    }
                } else if(this.connection.rejoinAttempts < 5) {
                    await wait((this.connection.rejoinAttempts + 1) * 5000);
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
                } catch{
                    if(this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
                        this.connection.destroy();
                    }
                }
            }
        });

        this.audioPlayer.on('stateChange', (oldState, newState) => {
            let nextHintInt: NodeJS.Timeout;
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
                    if(board) {
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
                        (this.textChannel.client as unknown as CustomClient).triviaManager.delete(this.textChannel.guildId);
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

                let lastMessage: Message = null!;

                let skipCounter = 0;
                const skippedArray: string[] = [];
                let hints = 0;
                let timeForSong = 60000;
                if(!this.useYoutube) { timeForSong = 30000; }
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

                const showHint = async(singer: string, title: string) => {
                    const singerHint = convertToHint(singer, hints);
                    const titleHint = convertToHint(title, hints);
                    const song = `${songSingerFoundTime === -1 ? singerHint : singer}: ${songNameFoundTime === -1 ? titleHint : title}`;
                    const embed = new MessageEmbed().setColor('#ff7373').setTitle(`:musical_note: The song is:  \`${song}\``);
                    if(lastMessage !== null) { lastMessage.delete().catch(() => { console.log('Failed to delete message'); }); }
                    lastMessage = await this.textChannel.send({embeds: [embed]});
                    hints++;
                };
                // let timeoutId = setTimeout(() => collector.stop(), 30000);

                nextHintInt = setInterval(() => {
                    void showHint(normalizeValue((this.queue[0] || {artists: ['']}).artists[0]), normalizeValue((this.queue[0] || {name: ''}).name));
                }, 5000);

                void showHint(normalizeValue((this.queue[0] || {artists: ['']}).artists[0]), normalizeValue((this.queue[0] || {name: ''}).name));

                collector.on('collect', (msg: Message) => {
                    if(!this.score.has(msg.author.username)) { return; }
                    const time = Date.now();
                    const guess = normalizeValue(msg.content);
                    const title = normalizeValue(this.queue[0].name);
                    const singer = normalizeValue(this.queue[0].artists[0]);
                    // let singers = this.queue[0].artists.map(normalizeValue);

                    if(guess === 'skip') {
                        if(skippedArray.includes(msg.author.username)) { return; }
                        skippedArray.push(msg.author.username);
                        skipCounter++;
                        if(skipCounter > this.score.size * 0.6) { return collector.stop(); }
                        return;
                    }

                    if(msg.content.includes(':')) { return; }
                    // const gotAnArtist = singers.map((singer) => guess.includes(singer));
                    const gotSinger = guess.includes(singer);
                    const gotName = guess.includes(title);

                    if(!gotSinger && !gotName) { return void msg.react('❌'); }

                    let gotSingerInTime = false;
                    let gotNameInTime = false;

                    const firstSingerGuess = songSingerFoundTime === -1 && (gotSinger);
                    const firstNameGuess = songNameFoundTime === -1 && (gotName);

                    if(firstSingerGuess) { songSingerFoundTime = time; }
                    if((time - songSingerFoundTime) < answerTimeout) { gotSingerInTime = true; }
                    if(firstNameGuess) { songNameFoundTime = time; }
                    if((time - songNameFoundTime) < answerTimeout) { gotNameInTime = true; }

                    if(gotSingerInTime && !songSingerWinners[msg.author.username]) {
                        songSingerWinners[msg.author.username] = true;
                        this.score.set(msg.author.username, (this.score.get(msg.author.username) || 0) + 1);
                        void msg.react('☑');
                    }

                    if(gotNameInTime && !songNameWinners[msg.author.username]) {
                        songNameWinners[msg.author.username] = true;
                        this.score.set(msg.author.username, (this.score.get(msg.author.username) || 0) + 1);
                        void msg.react('☑');
                    }

                    if((songSingerFoundTime !== -1) && (songNameFoundTime !== -1)) { setTimeout(() => collector.stop(), 1000); }
                });

                collector.on('end', () => {
                    if(typeof nextHintInt !== 'undefined') {
                        clearTimeout(nextHintInt);
                    }
                    if(lastMessage !== null) { void lastMessage.delete().catch(() => { console.log('Failed to delete message'); }); }
                    /*The reason for this if statement is that we don't want to get an empty embed returned via chat by the bot if end-trivia command was called */
                    if(this.wasTriviaEndCalled) {
                        this.wasTriviaEndCalled = false;
                        return;
                    }

                    this.audioPlayer.stop();

                    const sortedScoreMap = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));

                    const song = `${capitalize_Words(this.queue[0].artists[0])}: ${capitalize_Words(this.queue[0].name)}`;
                    const board = getLeaderBoard(Array.from(sortedScoreMap.entries()));
                    if(board) {
                        const embed = new MessageEmbed()
                            .setColor('#ff7373')
                            .setTitle(`:musical_note: The song was:  ${song} (${Math.max(this.queue.length - 1, 0)} left)`)
                            .setDescription(board);

                        void this.textChannel.send({embeds: [embed]});
                    }
                    return;
                });
            }
        });

        this.audioPlayer.on('error', (error) => { console.error(error); });

        this.connection.subscribe(this.audioPlayer);
    }

    stop(): void {
        this.queue.length = 0;
        this.audioPlayer.stop(true);
    }

    reset(): void {
        this.queue.length = 0;
        this.wasTriviaEndCalled = true;
        this.score.clear();
        this.connection.destroy();
    }

    async process(queue: PlayTrack[]): Promise<void> {
        const [song] = this.queue;
        try {
            if(!this.useYoutube && song.preview_url !== '') {
                const resource = createAudioResource(`${song.preview_url}.mp3`, {inputType: StreamType.Arbitrary});
                this.audioPlayer.play(resource);
            } else {
                const stream = ytdl(song.url, {filter: 'audio', quality: 'highestaudio', highWaterMark: 1 << 25});
                const resource = createAudioResource(stream, {inputType: StreamType.Arbitrary});
                this.audioPlayer.play(resource);
            }
        } catch(err) {
            console.error(err);
            return this.process(queue);
        }
    }
}

export default TriviaPlayer;
