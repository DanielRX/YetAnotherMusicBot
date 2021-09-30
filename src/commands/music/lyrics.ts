/* eslint-disable @typescript-eslint/naming-convention */
import {MessageEmbed} from 'discord.js';
import cheerio from 'cheerio';
import {config} from '../../utils/config';
import {fetch} from '../../utils/utils';
import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {playerManager, guildData} from '../../utils/client';
import {logger} from '../../utils/logging';

export const name = 'lyrics';
export const description = 'Get the lyrics of any song or the lyrics of the currently playing song!';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'songname', description: ':mag: What song lyrics would you like to get?', required: false, choices: [], default: ''}
];

const cleanSongName = (songName: string) => {
    return songName
        .replace(/ *\([^)]*\) */g, '')
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
};

const searchSong = async(query: string): Promise<string> => {
    const searchURL = `https://api.genius.com/search?q=${encodeURI(query)}`;
    const headers = {Authorization: `Bearer ${config.geniusLyricsAPI}`};
    try {
        const body = await fetch<{response: {hits: ({result: {api_path: string}})[]}}>(searchURL, {headers});
        const result = await body.json();
        const songPath = result.response.hits[0].result.api_path;
        return `https://api.genius.com${songPath}`;
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(':x: No song has been found for this query');
    }
};

const getSongPageURL = async(url: string) => {
    const headers = {Authorization: `Bearer ${config.geniusLyricsAPI}`};
    try {
        const body = await fetch<{response: {song: {url: string}}}>(url, {headers});
        const result = await body.json();
        if(!result.response.song.url) {
            throw new Error(':x: There was a problem finding a URL for this song');
        } else {
            return result.response.song.url;
        }
    } catch(e: unknown) {
        logger.error(e);
        throw new Error('There was a problem finding a URL for this song');
    }
};

const getLyrics = async(url: string) => {
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
    } catch(e: unknown) {
        logger.error(e);
        throw new Error('There was a problem fetching lyrics for this song, please try again');
    }
};

export const execute = async(interaction: CustomInteraction, songName: string): Promise<CommandReturn> => {
    if(!config.geniusLyricsAPI) { return ':x: Lyrics command is not enabled'; }
    const player = playerManager.get(interaction.guildId);
    const guild = guildData.get(interaction.guildId);
    if(songName === '') {
        if(!player) { return 'There is no song playing! Enter a song name or play a song'; }
        if(guild) {
            if(guild.triviaData.isTriviaRunning) {
                return ':x: Please try again after the trivia has ended';
            }
        }
        songName = player.nowPlaying?.name ?? '';
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
                    .setTitle(`Lyrics page #${i}`)
                    .setDescription(lyrics.slice((i - 1) * 4096, i * 4096))
                    .setFooter('Provided by genius.com'));
            }
        }

        const pageData = {title: `${songName} lyrics`, pages: lyricsArray, color: '#9096E6' as const, url: songPageURL, author: {username: interaction.member.user.username, avatar: interaction.member.user.displayAvatarURL()}};
        return {pages: pageData};
    } catch(e: unknown) {
        logger.error(e);
        return 'Something went wrong! Please try again later';
    }
};

