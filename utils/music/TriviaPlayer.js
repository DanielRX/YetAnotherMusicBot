// @ts-check
const {AudioPlayerStatus, createAudioPlayer, entersState, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioResource, StreamType} = require('@discordjs/voice');
const {setTimeout} = require('timers');
const {promisify} = require('util');
const ytdl = require('ytdl-core');
const {MessageEmbed, GuildChannel, BaseGuildTextChannel, Message} = require('discord.js');
const wait = promisify(setTimeout);

const capitalize_Words = (str) => {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const normalizeValue = (value) =>
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

const getLeaderBoard = (arr) => {
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

class TriviaPlayer {
    constructor(useYoutube) {
        this.useYoutube = useYoutube;
        this.connection = null;
        this.audioPlayer = createAudioPlayer();
        this.score = new Map();
        this.queue = [];
        /**
         * @type {BaseGuildTextChannel}
         */
        this.textChannel = null;
        this.wasTriviaEndCalled = false;
    }

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
            let nextHintInt = -1;
            if(newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                this.queue.shift();
                // Finished playing audio
                if(this.queue.length) {
                    // Play next song
                    this.process(this.queue);
                } else {
                    const sortedScoreMap = new Map([...this.score.entries()].sort(function(a, b) {
                        return b[1] - a[1];
                    }));

                    if(this.wasTriviaEndCalled) { return; }

                    const embed = new MessageEmbed()
                        .setColor('#ff7373')
                        .setTitle(`Music Quiz Results:`)
                        .setDescription(getLeaderBoard(Array.from(sortedScoreMap.entries())));
                    void this.textChannel.send({embeds: [embed]});

                    // Leave channel close connection and subscription
                    if(this.connection._state.status !== 'destroyed') {
                        this.connection.destroy();
                        this.textChannel.client.triviaManager.delete(this.textChannel.guildId);
                    }
                }
            } else if(newState.status === AudioPlayerStatus.Playing) {
                // Trivia logic
                const start = Date.now();
                let songNameFoundTime = -1;
                let songNameWinners = {};
                let songSignerWinners = {};
                let songSignerFoundTime = -1;
                const answerTimeout = 1500;
                /**
                 * @type {Message}
                 */
                let lastMessage = null;

                let skipCounter = 0;
                const skippedArray = [];
                let hints = 0;
                let time = 60000;
                if(!this.useYoutube) { time = 30000; }
                const collector = this.textChannel.createMessageCollector({time});

                const showHint = async(singer, title) => {
                    const signerHint = [...singer].map((_, i) => i < hints ? _ : _ === ' ' ? ' ' : '*').join('');
                    const titleHint = [...title].map((_, i) => i < hints ? _ : _ === ' ' ? ' ' : '*').join('');
                    const song = `\`${songSignerFoundTime === -1 ? signerHint : singer}: ${songNameFoundTime === -1 ? titleHint : title}\``;
                    const embed = new MessageEmbed().setColor('#ff7373').setTitle(`:musical_note: The song is:  ${song}`);
                    if(lastMessage !== null) {
                        await lastMessage.delete();
                    }
                    lastMessage = await this.textChannel.send({embeds: [embed]});
                    nextHintInt = setTimeout(() => { showHint(this.queue[0].singer, this.queue[0].title); }, 7500);
                    hints++;
                };
                // let timeoutId = setTimeout(() => collector.stop(), 30000);

                nextHintInt = setTimeout(() => {
                    void showHint(normalizeValue(this.queue[0].singer), normalizeValue(this.queue[0].title));
                }, 7500);

                collector.on('collect', (msg) => {
                    if(!this.score.has(msg.author.username)) { return; }
                    const time = Date.now();
                    let guess = normalizeValue(msg.content);
                    let title = normalizeValue(this.queue[0].title);
                    let singer = normalizeValue(this.queue[0].singer);
                    // let singers = this.queue[0].artists.map(normalizeValue);

                    // if(guess === 'hint') {
                    //     if(time - start > (5 + (5 * hints)) * 1000) {
                    //         // clearTimeout(timeoutId);
                    //         // setTimeout(() => collector.stop(), Math.min(40000 + (5000 * hints), 60000) + (time - start));
                    //         const signerHint = [...singer].map((_, i) => i < hints ? _ : _ === ' ' ? ' ' : '*').join('');
                    //         const titleHint = [...title].map((_, i) => i < hints ? _ : _ === ' ' ? ' ' : '*').join('');
                    //         const song = `\`${songSignerFoundTime === -1 ? signerHint : singer}: ${songNameFoundTime === -1 ? titleHint : title}\``;
                    //         const embed = new MessageEmbed().setColor('#ff7373').setTitle(`:musical_note: The song is:  ${song}`);
                    //         this.textChannel.send({embeds: [embed]});
                    //     }
                    //     return;
                    // }

                    if(guess === 'skip') {
                        if(skippedArray.includes(msg.author.username)) { return; }
                        skippedArray.push(msg.author.username);
                        skipCounter++;
                        if(skipCounter > this.score.size * 0.6) { return collector.stop(); }
                        return;
                    }

                    // const gotAnArtist = singers.map((singer) => guess.includes(singer));
                    const gotSigner = guess.includes(singer);
                    const gotName = guess.includes(title);

                    if(!gotSigner && !gotName) { return msg.react('❌'); }

                    let gotSignerInTime = false;
                    let gotNameInTime = false;

                    const firstSignerGuess = songSignerFoundTime === -1 && (gotSigner);
                    const firstNameGuess = songNameFoundTime === -1 && (gotName);

                    if(firstSignerGuess) { songSignerFoundTime = time; }
                    if((time - songSignerFoundTime) < answerTimeout) { gotSignerInTime = true; }
                    if(firstNameGuess) { songNameFoundTime = time; }
                    if((time - songNameFoundTime) < answerTimeout) { gotNameInTime = true; }

                    if(gotSignerInTime && !songSignerWinners[msg.author.username]) {
                        songSignerWinners[msg.author.username] = true;
                        this.score.set(msg.author.username, this.score.get(msg.author.username) + 1);
                        msg.react('☑');
                    }

                    if(gotNameInTime && !songNameWinners[msg.author.username]) {
                        songNameWinners[msg.author.username] = true;
                        this.score.set(msg.author.username, this.score.get(msg.author.username) + 1);
                        msg.react('☑');
                    }

                    if((songSignerFoundTime !== -1) && (songNameFoundTime !== -1)) { setTimeout(() => collector.stop(), 1000); }
                });

                collector.on('end', () => {
                    if(nextHintInt !== -1) {
                        clearTimeout(nextHintInt);
                    }
                    if(lastMessage !== null) {
                        lastMessage.delete();
                    }
                    /*The reason for this if statement is that we don't want to get an empty embed returned via chat by the bot if end-trivia command was called */
                    if(this.wasTriviaEndCalled) {
                        this.wasTriviaEndCalled = false;
                        return;
                    }

                    this.audioPlayer.stop();

                    const sortedScoreMap = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));

                    const song = `${capitalize_Words(this.queue[0].singer)}: ${capitalize_Words(this.queue[0].title)}`;

                    const embed = new MessageEmbed()
                        .setColor('#ff7373')
                        .setTitle(`:musical_note: The song was:  ${song} (${Math.max(this.queue.length - 1, 0)} left)`)
                        .setDescription(getLeaderBoard(Array.from(sortedScoreMap.entries())));

                    this.textChannel.send({embeds: [embed]});
                    return;
                });
            }
        });

        this.audioPlayer.on('error', (error) => { console.error(error); });

        this.connection.subscribe(this.audioPlayer);
    }

    stop() {
        this.queue.length = 0;
        this.audioPlayer.stop(true);
    }

    reset() {
        this.queue.length = 0;
        this.wasTriviaEndCalled = true;
        this.score.clear();
        this.connection.destroy();
    }

    async process(queue) {
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

module.exports = TriviaPlayer;
