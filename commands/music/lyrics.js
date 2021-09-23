// @ts-check

const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {PagesBuilder} = require('discord.js-pages');
const cheerio = require('cheerio');
const {geniusLyricsAPI} = require('../../utils/config');
const {setupOption, fetch} = require('../../utils/utils');

const name = 'lyrics';
const description = 'Get the lyrics of any song or the lyrics of the currently playing song!';

const options = [
    {name: 'songname', description: ':mag: What song lyrics would you like to get?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
* @param {string} songName
* @returns {string}
*/
const cleanSongName = (songName) => {
    return songName
        .replace(/ *\([^)]*\) */g, '')
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
};

/**
* @param {string} query
* @returns {Promise<string>}
*/
const searchSong = async(query) => {
    const searchURL = `https://api.genius.com/search?q=${encodeURI(query)}`;
    const headers = {Authorization: `Bearer ${geniusLyricsAPI}`};
    try {
        const body = await fetch(searchURL, {headers});
        const result = await body.json();
        const songPath = result.response.hits[0].result.api_path;
        return `https://api.genius.com${songPath}`;
    } catch(e) {
        throw new Error(':x: No song has been found for this query');
    }
};

/**
* @param {string} url
* @returns {Promise<string>}
*/
const getSongPageURL = async(url) => {
    const headers = {Authorization: `Bearer ${geniusLyricsAPI}`};
    try {
        const body = await fetch(url, {headers});
        const result = await body.json();
        if(!result.response.song.url) {
            throw new Error(':x: There was a problem finding a URL for this song');
        } else {
            return result.response.song.url;
        }
    } catch(e) {
        console.log(e);
        throw new Error('There was a problem finding a URL for this song');
    }
};

/**
* @param {string} url
* @returns {Promise<string>}
*/
const getLyrics = async(url) => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const $ = cheerio.load(text);
        let lyrics = $('.lyrics').text().trim();
        if(!lyrics) {
            $('.Lyrics__Container-sc-1ynbvzw-8').find('br').replaceWith('\n');
            lyrics = $('.Lyrics__Container-sc-1ynbvzw-8').text();
            if(!lyrics) {
                throw new Error('There was a problem fetching lyrics for this song, please try again');
            } else {
                return lyrics.replace(/(\[.+\])/g, '');
            }
        } else {
            return lyrics.replace(/(\[.+\])/g, '');
        }
    } catch(e) {
        console.log(e);
        throw new Error('There was a problem fetching lyrics for this song, please try again');
    }
};

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<import('discord.js').Message | import('discord-api-types').APIMessage>}
 */
const execute = async(interaction) => {
    if(!geniusLyricsAPI) { return interaction.reply(':x: Lyrics command is not enabled'); }
    void interaction.deferReply();
    const player = interaction.client.playerManager.get(interaction.guildId);
    const guildData = interaction.client.guildData.get(interaction.guildId);
    let songName = interaction.options.get('songname');
    if(songName) {
        songName = songName.value;
    } else {
        if(!player) { return interaction.followUp('There is no song playing! Enter a song name or play a song'); }
        if(guildData) {
            if(guildData.triviaData.isTriviaRunning) {
                return interaction.followUp(':x: Please try again after the trivia has ended');
            }
        }
        songName = player.nowPlaying.title;
    }

    try {
        const url = await searchSong(cleanSongName(songName));
        const songPageURL = await getSongPageURL(url);
        const lyrics = await getLyrics(songPageURL);

        const lyricsIndex = Math.round(lyrics.length / 4096) + 1;
        const lyricsArray = [];

        for(let i = 1; i <= lyricsIndex; ++i) {
            if(lyrics.trim().slice((i - 1) * 4096, i * 4096).length !== 0) {
                lyricsArray.push(new MessageEmbed()
                    .setTitle(`Lyrics page #` + i)
                    .setDescription(lyrics.slice((i - 1) * 4096, i * 4096))
                    .setFooter('Provided by genius.com'));
            }
        }

        void new PagesBuilder(interaction)
            .setTitle(`${songName} lyrics`)
            .setPages(lyricsArray)
            .setColor('#9096e6')
            .setURL(songPageURL)
            .setAuthor(interaction.member.user.username, interaction.member.user.displayAvatarURL())
            .build();
    } catch(error) {
        console.error(error);
        return interaction.followUp('Something went wrong! Please try again later');
    }
};

module.exports = {data, execute, name, description};
