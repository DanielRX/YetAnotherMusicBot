/* eslint-disable @typescript-eslint/naming-convention */
import {MessageEmbed} from 'discord.js';
import cheerio from 'cheerio';
import {config} from '../../utils/config';
import {fetch} from '../../utils/utils';
import type {CommandReturn, CommandInput} from '../../utils/types';
import {playerManager, guildData} from '../../utils/client';
import {logger} from '../../utils/logging';

export const name = 'lyrics';
export const description = 'Get the lyrics of any song or the lyrics of the currently playing song!';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'songname', description: ':mag: What song lyrics would you like to get?', required: false, choices: [], default: ''}
];

const embedColour = '#9096E6';

const cleanSongName = (songName: string) => {
    return songName
        .replace(/ *\([^)]*\) */g, '')
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
};

const searchSong = async(query: string, errorMessage: string): Promise<string> => {
    const searchURL = `https://api.genius.com/search?q=${encodeURI(query)}`;
    const headers = {Authorization: `Bearer ${config.geniusLyricsAPI}`};
    try {
        const body = await fetch<{response: {hits: ({result: {api_path: string}})[]}}>(searchURL, {headers});
        const result = await body.json();
        const songPath = result.response.hits[0].result.api_path;
        return `https://api.genius.com${songPath}`;
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(errorMessage);
    }
};

const getSongPageURL = async(url: string, errorMessage: string) => {
    const headers = {Authorization: `Bearer ${config.geniusLyricsAPI}`};
    try {
        const body = await fetch<{response: {song: {url: string}}}>(url, {headers});
        const result = await body.json();
        if(!result.response.song.url) {
            throw new Error(errorMessage);
        } else {
            return result.response.song.url;
        }
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(errorMessage);
    }
};

const getLyrics = async(url: string, errorMessage: string) => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        const $ = cheerio.load(text);
        let lyrics = $('.lyrics').text().trim();
        if(!lyrics) {
            $('.Lyrics__Container-sc-1ynbvzw-8').find('br').replaceWith('\n');
            lyrics = $('.Lyrics__Container-sc-1ynbvzw-8').text();
            if(!lyrics) {
                throw new Error(errorMessage);
            } else {
                return lyrics.replace(/(\[.+\])/g, '');
            }
        } else {
            return lyrics.replace(/(\[.+\])/g, '');
        }
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(errorMessage);
    }
};

export const execute = async({sender, guildId, messages, params: {songName}}: CommandInput<{songName: string}>): Promise<CommandReturn> => {
    if(!config.geniusLyricsAPI) { return messages.COMMAND_DISABLED(); }
    const player = playerManager.get(guildId);
    const guild = guildData.get(guildId);
    if(songName === '') {
        if(!player) { return messages.NO_SONG_PLAYING(); }
        if(guild) {
            if(guild.triviaData.isTriviaRunning) { return messages.TRIVIA_IS_RUNNING(); }
        }
        songName = player.nowPlaying?.name ?? '';
    }

    const url = await searchSong(cleanSongName(songName), messages.SONG_NOT_FOUND());
    const songPageURL = await getSongPageURL(url, messages.GENERIC_ERROR());
    const lyrics = await getLyrics(songPageURL, messages.GENERIC_ERROR());

    const lyricsIndex = Math.round(lyrics.length / 4096) + 1;
    const lyricsArray = [];

    for(let i = 1; i <= lyricsIndex; ++i) {
        if(lyrics.trim().slice((i - 1) * 4096, i * 4096).length !== 0) {
            lyricsArray.push(new MessageEmbed()
                .setTitle(`Lyrics page #${i}`) // TODO: Replace by message
                .setDescription(lyrics.slice((i - 1) * 4096, i * 4096))
                .setFooter(`${messages.POWERED_BY} genius.com`)); // TODO: Replace by message
        }
    }

    const pageData = {
        title: `${songName} lyrics`, /* TODO: Replace by message */
        pages: lyricsArray,
        color: embedColour,
        url: songPageURL,
        author: {username: sender.user.username, avatar: sender.user.displayAvatarURL()}
    };
    return {pages: pageData};
};

