import type {VoiceConnection} from '@discordjs/voice';
import type {BaseGuildTextChannel, Message} from 'discord.js';
import type {PlayTrack} from '../types';
import {AudioPlayerStatus, createAudioResource, StreamType} from '@discordjs/voice';
import {setTimeout} from 'timers';
import {MessageEmbed} from 'discord.js';
import {triviaManager} from '../client';
import {logger} from '../../utils/logging';
import {Player} from './Player';
import {config} from '../config';
import * as tmi from 'tmi.js';

const capitalizeWords = (str: string) => {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const normalizeValue = (hardMode: boolean) => (value: string) => {
    let val = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    if(!hardMode) {
        val = val.replace(/[^0-9a-zA-Z\s]/g, ''); // Remove non-alphanumeric characters
    }
    return val
        .replace(/ - .*/g, '')
        .replace(/ \(.*\)/g, '')
        .replace(/ \[.*\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase(); // Remove duplicate spaces
};

const getLeaderBoard = (arr: [string, number][]) => { // TODO: Shared medals
    if(typeof arr === 'undefined') { return; }
    const players = arr.filter(([, points]) => points > 0);
    if(typeof players[0] === 'undefined') { return; } // Issue #422
    let leaderBoard = '';

    leaderBoard = `:first_place:  **${players[0][0]}:** ${players[0][1]}`;

    players.forEach(([player, score], i) => {
        if(i === 0) { return; }
        leaderBoard += `\n\n   ${i + 1 === 2 ? ':second_place:' : i + 1 === 3 ? ':third_place:' : i + 1}: ${player}: ${score}`;
    });
    return leaderBoard;
};

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

const timeForSong = 30000;
const answerTimeout = 1500;

export class TriviaPlayer extends Player {
    public textChannel: BaseGuildTextChannel = null!;
    public readonly score: Map<string, number> = new Map();
    public queue: PlayTrack[] = [];
    private wasTriviaEndCalled = false;
    private lastMessage: Message | null = null;
    private hints = 0;
    private songNameFoundTime = -1;
    private songSingerFoundTime = -1;
    private skippedArray: string[] = [];
    private songNameWinners: {[key: string]: boolean} = {};
    private songSingerWinners: {[key: string]: boolean} = {};
    private readonly twitchClient: tmi.Client | null;
    // eslint-disable-next-line @typescript-eslint/no-parameter-properties
    public constructor(public hardMode: boolean, public roundMode: boolean, public twitchChannel: string) {
        super();
        if(this.twitchChannel !== '') {
            this.twitchClient = new tmi.client({identity: {username: config.twitchUsername, password: config.twitchToken}, channels: [this.twitchChannel]});
            void this.twitchClient.connect();
        }
    }

    public startRound(): void {
        this.songNameFoundTime = -1;
        this.songSingerFoundTime = -1;
        this.songNameWinners = {};
        this.songSingerWinners = {};
        this.lastMessage = null;
        this.skippedArray = [];
        this.hints = 0;
    }

    public passConnection(connection: VoiceConnection): void {
        super.passConnection(connection);

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
                return;
            }
            if(newState.status !== AudioPlayerStatus.Playing) { return; }
            // Trivia logic
            this.startRound();

            const collector = this.textChannel.createMessageCollector({time: timeForSong});
            const song = normalizeValue(this.hardMode)((this.queue[0] ?? {name: ''}).name);
            const artists = (this.queue[0] ?? {artists: ['']}).artists.map(normalizeValue(this.hardMode));
            void this.showHint(artists[0], song, artists);
            nextHintInt = setInterval(() => { void this.showHint(artists[0], song, artists); }, 5000);

            this.twitchClient?.on('message', (channel: string, user: tmi.ChatUserstate, message: string, self: boolean) => {
                if(self) { return; }
                if(!this.queue[0]) { return; }
                const username = `${user.username}`;
                // if(!this.score.has(username)) { return; }
                const time = Date.now();
                const guess = normalizeValue(this.hardMode)(message);
                const title = normalizeValue(this.hardMode)(this.queue[0].name);
                const singers = this.queue[0].artists.map(normalizeValue(this.hardMode));

                const gotAnArtist = singers.some((artist) => guess.includes(artist));
                const gotName = guess.includes(title);

                let gotSingerInTime = false;
                let gotNameInTime = false;

                const firstSingerGuess = this.songSingerFoundTime === -1 && (gotAnArtist);
                const firstNameGuess = this.songNameFoundTime === -1 && (gotName);

                if(firstSingerGuess) { this.songSingerFoundTime = time; setTimeout(() => { this.twitchClient?.say(this.twitchChannel, `The artists were guessed by: ${Object.keys(this.songSingerWinners).join(', ')} and were: ${this.queue[0].artists.join(', ')}`); }, answerTimeout); }
                if(((time - this.songSingerFoundTime) < answerTimeout && !this.songSingerWinners[username])) { gotSingerInTime = true; }
                if(firstNameGuess) { this.songNameFoundTime = time; setTimeout(() => { this.twitchClient?.say(this.twitchChannel, `The song was guessed by: ${Object.keys(this.songNameWinners).join(', ')} and was: ${this.queue[0].name}`); }, answerTimeout); }
                if(((time - this.songNameFoundTime) < answerTimeout) && !this.songNameWinners[username]) { gotNameInTime = true; }

                if(gotSingerInTime) {
                    this.songSingerWinners[username] = true;
                    this.score.set(username, (this.score.get(username) ?? 0) + 1);
                }

                if(gotNameInTime) {
                    this.songNameWinners[username] = true;
                    this.score.set(username, (this.score.get(username) ?? 0) + 1);
                }

                if((this.songSingerFoundTime !== -1) && (this.songNameFoundTime !== -1)) {
                    setTimeout(() => { collector.stop(); }, 1000);
                }
            });

            const onDiscordMessage = (msg: Message) => {
                if(!this.score.has(msg.author.username)) { return; }
                const time = Date.now();
                const guess = normalizeValue(this.hardMode)(msg.content);
                const title = normalizeValue(this.hardMode)(this.queue[0].name);
                const singers = this.queue[0].artists.map(normalizeValue(this.hardMode));

                if(guess === 'skip') {
                    if(this.skippedArray.includes(msg.author.username)) { return; }
                    this.skippedArray.push(msg.author.username);
                    if(this.skippedArray.length > this.score.size * 0.6) { return collector.stop(); }
                    return;
                }

                if(msg.content.includes(':')) { return; }
                const gotAnArtist = singers.some((artist) => guess.includes(artist));
                const gotName = guess.includes(title);

                if(!gotName && !gotAnArtist) { return void msg.react('❌'); }

                let gotSingerInTime = false;
                let gotNameInTime = false;

                const firstSingerGuess = this.songSingerFoundTime === -1 && (gotAnArtist);
                const firstNameGuess = this.songNameFoundTime === -1 && (gotName);

                if(firstSingerGuess) { this.songSingerFoundTime = time; setTimeout(() => { this.twitchClient?.say(this.twitchChannel, `The artists were guessed by: ${Object.keys(this.songSingerWinners).join(', ')} and were: ${this.queue[0].artists.join(', ')}`); }, answerTimeout); }
                if(((time - this.songSingerFoundTime) < answerTimeout && !this.songSingerWinners[msg.author.username])) { gotSingerInTime = true; }
                if(firstNameGuess) { this.songNameFoundTime = time; setTimeout(() => { this.twitchClient?.say(this.twitchChannel, `The song was guessed by: ${Object.keys(this.songNameWinners).join(', ')} and was: ${this.queue[0].name}`); }, answerTimeout); }
                if(((time - this.songNameFoundTime) < answerTimeout) && !this.songNameWinners[msg.author.username]) { gotNameInTime = true; }

                if(gotSingerInTime) {
                    this.songSingerWinners[msg.author.username] = true;
                    this.score.set(msg.author.username, (this.score.get(msg.author.username) ?? 0) + 1);
                    void msg.react('☑');
                }

                if(gotNameInTime) {
                    this.songNameWinners[msg.author.username] = true;
                    this.score.set(msg.author.username, (this.score.get(msg.author.username) ?? 0) + 1);
                    void msg.react('☑');
                }

                if((this.songSingerFoundTime !== -1) && (this.songNameFoundTime !== -1)) { setTimeout(() => collector.stop(), 1000); }
            };

            const onCollectorEnd = () => {
                if(typeof nextHintInt !== 'undefined') {
                    clearTimeout(nextHintInt);
                }
                if(this.lastMessage !== null) { void this.lastMessage.delete().catch(() => { logger.error('Failed to delete message'); }); }
                /*The reason for this if statement is that we don't want to get an empty embed returned via chat by the bot if end-trivia command was called */
                if(this.wasTriviaEndCalled) {
                    this.wasTriviaEndCalled = false;
                    return;
                }

                this.audioPlayer.stop();

                const sortedScoreMap = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));

                const song = `${capitalizeWords(this.queue[0].artists[0])}: ${capitalizeWords(this.queue[0].name)}`;
                const board = getLeaderBoard(Array.from(sortedScoreMap.entries()));
                if(typeof board === 'undefined') { return; }
                const embed = new MessageEmbed()
                    .setColor('#ff7373')
                    .setTitle(`:musical_note: The song was: (${Math.max(this.queue.length - 1, 0)} left)`)
                    .setDescription(`**[${song}](https://open.spotify.com/track/${(this.queue[0] as any).id})**\n\n${board}`);

                void this.textChannel.send({embeds: [embed]});
            };

            collector.on('collect', onDiscordMessage);
            collector.on('end', onCollectorEnd);
        });
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

    private async showHint(_singer: string, title: string, artists: string[]) { // TODO: Skip "the"
        // const singerHint = convertToHint(singer, hints);
        const titleHint = convertToHint(title, this.hints);
        const artistHints = artists.map((artist) => convertToHint(artist, this.hints));
        const song = `\`${this.songNameFoundTime === -1 ? titleHint : title}\`\nBy:\n ${this.songSingerFoundTime === -1 ? artistHints.map((artist) => `\`${artist}\``).join('\n') : artists.map((artist) => `\`${artist}\``).join('\n')}`;
        const embed = new MessageEmbed().setColor('#ff7373').setTitle(`The song is:`).setDescription(song);
        if(this.lastMessage !== null) { this.lastMessage.delete().catch(() => { logger.error('Failed to delete message'); }); }
        this.lastMessage = await this.textChannel.send({embeds: [embed]});
        this.hints++;
    };
}

export default TriviaPlayer;
