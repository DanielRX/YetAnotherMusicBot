import type {VoiceConnection} from '@discordjs/voice';
import type {BaseGuildTextChannel, Message, VoiceChannel} from 'discord.js';
import type {PlayTrack} from '../types';
import {AudioPlayerStatus, createAudioResource, StreamType} from '@discordjs/voice';
import {setTimeout} from 'timers';
import {MessageEmbed} from 'discord.js';
import fs from 'fs-extra';
import {triviaManager} from '../client';
import {logger} from '../../utils/logging';
import {Player} from './Player';
import {config} from '../config';
import * as tmi from 'tmi.js';
import {getRandom} from '../utils';

const capitalizeWords = (str: string) => {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const normalizeValue = (hardMode: boolean) => (value: string) => {
    let val = value.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
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

const getLeaderBoard = (arr: [string, number][], limit = 10) => { // TODO: Shared medals
    if(typeof arr === 'undefined') { return; }
    const players = arr.filter(([, points]) => points > 0).slice(0, limit);
    if(typeof players[0] === 'undefined') { return; } // Issue #422
    let leaderBoard = '';

    const cleanPlayer = (player: string) => {
        const [platform, username] = player.split(':');
        if(platform === 't') {
            return `<:twitch:897531638144184370> ${username}`;
        }
        return `<:discord:897536633145032706> ${username}`;
    };

    leaderBoard = `:first_place:  **${cleanPlayer(players[0][0])}:** ${players[0][1]}`;

    players.forEach(([player, score], i) => {
        if(i === 0) { return; }
        leaderBoard += `\n\n   ${i + 1 === 2 ? ':second_place:' : i + 1 === 3 ? ':third_place:' : i + 1} ${cleanPlayer(player)}: ${score}`;
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
const ROUND_SIZE = 25;

type TriviaElement = {youtubeUrl: string, previewUrl: string, artists: string[], album: string, name: string, id: string};

export class TriviaPlayer extends Player {
    public textChannel: BaseGuildTextChannel = null!;
    public readonly score: Map<string, number> = new Map();
    public queue: PlayTrack[] = [];
    private wasTriviaEndCalled = false;
    private lastMessage: Message | null = null;
    private lastSongMessage: Message | null = null;
    private lastRoundMessage: Message | null = null;
    private hints = 0;
    private songNameFoundTime = -1;
    private songSingerFoundTime = -1;
    private skippedArray: string[] = [];
    private songNameWinners: {[key: string]: boolean} = {};
    private songSingerWinners: {[key: string]: boolean} = {};
    private readonly twitchClient: tmi.Client | null;
    private rounds = 1;
    private correctThisRound = 0;
    // eslint-disable-next-line @typescript-eslint/no-parameter-properties
    public constructor(public hardMode: boolean, public roundMode: boolean, public twitchChannel: string, public voiceChannel: VoiceChannel) {
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

    public async loadSongs(count: number): Promise<void> {
        const songs = await fs.readJSON('./resources/music/mk2/trivia.json') as TriviaElement[]; // TODO: Move type to types
        const albumData = await fs.readJSON('./resources/music/mk2/albums.json') as {[key: string]: {[key: string]: unknown}};
        const artistsData = await fs.readJSON('./resources/music/mk2/artists.json') as {[key: string]: string};
        const videoDataArray = songs.map((track) => ({...track, album: albumData[track.album], artists: track.artists.map((id) => artistsData[id])}));
        const randomLinks = getRandom(videoDataArray, count);
        this.queue = [];
        randomLinks.forEach(({artists, name, previewUrl, youtubeUrl, id}) => {
            this.queue.push({url: youtubeUrl, artists, previewUrl, name, voiceChannel: this.voiceChannel, id} as any);
        });
    }

    public passConnection(connection: VoiceConnection): void {
        super.passConnection(connection);

        this.audioPlayer.on('stateChange', async(oldState, newState) => {
            let nextHintInt: NodeJS.Timeout | undefined = undefined;
            if(newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                this.queue.shift();
                if(this.roundMode && (this.correctThisRound + this.queue.length < this.rounds)) {
                    const embed = new MessageEmbed()
                        .setColor('#ff7373')
                        .setTitle(`You lost the game at round ${this.rounds}!`)
                        .setDescription(`You needed ${this.rounds} but you only have ${this.correctThisRound} and ${this.queue.length} songs left`);
                    const sortedScoreMap = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));
                    const board = getLeaderBoard(Array.from(sortedScoreMap.entries()), 20);
                    logger.info(getLeaderBoard(Array.from(sortedScoreMap.entries()), Infinity));
                    const embed2 = new MessageEmbed()
                        .setColor('#ff7373')
                        .setTitle(`:musical_note: Scores:`)
                        .setDescription(`${board}`);
                    this.reset();
                    await this.textChannel.send({embeds: [embed2]});
                    return this.textChannel.send({embeds: [embed]});
                }
                if(this.roundMode && (this.correctThisRound >= this.rounds)) {
                    this.correctThisRound = 0;
                    const embed = new MessageEmbed().setColor('#ff7373').setTitle(`Round Complete`).setDescription(`You got through round ${this.rounds}`);
                    this.rounds++;
                    if(this.lastRoundMessage !== null) { void this.lastRoundMessage.delete().catch(() => { logger.error('Failed to delete message'); }); }
                    this.lastRoundMessage = await this.textChannel.send({embeds: [embed]});
                    await this.loadSongs(ROUND_SIZE);
                }
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

            const onMessage = (username: string, message: string, isDiscord: boolean, msg?: Message) => {
                if(!this.queue[0]) { return; }
                // if(!this.score.has(username)) { return; }
                const time = Date.now();
                const guess = normalizeValue(this.hardMode)(message);
                const title = normalizeValue(this.hardMode)(this.queue[0].name);
                const singers = this.queue[0].artists.map(normalizeValue(this.hardMode));

                if(guess === 'skip' && this.twitchChannel === '') {
                    if(this.skippedArray.includes(username)) { return; }
                    this.skippedArray.push(username);
                    if(this.skippedArray.length > this.score.size * 0.6) { return collector.stop(); }
                    return;
                }

                if(message.includes(':') && isDiscord) { return; }

                const gotAnArtist = singers.some((artist) => guess.includes(artist));
                const gotName = guess.includes(title);

                if(!gotName && !gotAnArtist && isDiscord) { return void msg?.react('❌'); }

                let gotSingerInTime = false;
                let gotNameInTime = false;

                const firstSingerGuess = this.songSingerFoundTime === -1 && (gotAnArtist);
                const firstNameGuess = this.songNameFoundTime === -1 && (gotName);

                if(firstSingerGuess) {
                    this.songSingerFoundTime = time;
                    // setTimeout(() => { this.twitchClient?.say(this.twitchChannel, `The artists were guessed by: ${Object.keys(this.songSingerWinners).map((x) => x.replace('t:', '').replace('d:', '')).join(', ')} and were: ${singers.join(', ')}`); }, answerTimeout);
                }
                if(((time - this.songSingerFoundTime) < answerTimeout && !this.songSingerWinners[username])) { gotSingerInTime = true; }
                if(firstNameGuess) {
                    this.songNameFoundTime = time;
                    // setTimeout(() => { this.twitchClient?.say(this.twitchChannel, `The song was guessed by: ${Object.keys(this.songNameWinners).map((x) => x.replace('t:', '').replace('d:', '')).join(', ')} and was: ${title}`); }, answerTimeout);
                }
                if(((time - this.songNameFoundTime) < answerTimeout) && !this.songNameWinners[username]) { gotNameInTime = true; }

                if(gotSingerInTime) {
                    this.songSingerWinners[username] = true;
                    this.score.set(username, (this.score.get(username) ?? 0) + 1);
                    if(isDiscord) { void msg?.react('☑'); }
                }

                if(gotNameInTime) {
                    this.songNameWinners[username] = true;
                    this.score.set(username, (this.score.get(username) ?? 0) + 1);
                    if(isDiscord) { void msg?.react('☑'); }
                }

                if((this.songSingerFoundTime !== -1) && (this.songNameFoundTime !== -1)) {
                    setTimeout(() => { collector.stop(); }, 1000);
                }
            };

            this.twitchClient?.on('message', (channel: string, user: tmi.ChatUserstate, message: string, self: boolean) => {
                if(self) { return; }
                return onMessage( `t:${user.username?.toLowerCase()}`, message, false);
            });

            const onDiscordMessage = (msg: Message) => {
                if(msg.author.username === msg.client.user?.username) { return; };
                return onMessage(`d:${msg.author.username.toLowerCase()}`, msg.content, true, msg);
            };

            const onCollectorEnd = async() => {
                if((this.songSingerFoundTime !== -1) && (this.songNameFoundTime !== -1)) {
                    this.correctThisRound++;
                }
                if(typeof nextHintInt !== 'undefined') {
                    clearTimeout(nextHintInt);
                }
                if(this.lastMessage !== null) { void this.lastMessage.delete().catch(() => { logger.error('Failed to delete message'); }); }
                if(this.lastSongMessage !== null && this.roundMode) { void this.lastSongMessage.delete().catch(() => { logger.error('Failed to delete message'); }); }
                /*The reason for this if statement is that we don't want to get an empty embed returned via chat by the bot if end-trivia command was called */
                if(this.wasTriviaEndCalled) {
                    this.wasTriviaEndCalled = false;
                    return;
                }

                this.audioPlayer.stop();

                const sortedScoreMap = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));

                const song = `${capitalizeWords(this.queue[0].artists[0])}: ${capitalizeWords(this.queue[0].name)}`;
                const board = getLeaderBoard(Array.from(sortedScoreMap.entries()), 10);
                if(typeof board === 'undefined') { return; }
                const embed = new MessageEmbed()
                    .setColor('#ff7373')
                    .setTitle(`:musical_note: The song was: (${Math.max(this.queue.length - 1, 0)} left${this.roundMode ? ' this round' : ''})`)
                    .setDescription(`**[${song}](https://open.spotify.com/track/${(this.queue[0] as any).id})**\n${this.roundMode ? `You've got ${this.correctThisRound} / ${this.rounds} right to pass this round!\n` : ''}\n${board}`);

                this.lastSongMessage = await this.textChannel.send({embeds: [embed]});
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
