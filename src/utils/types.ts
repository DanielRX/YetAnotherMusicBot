/* eslint-disable @typescript-eslint/naming-convention */
import type {Client, GuildMember, CommandInteraction, Message, TextBasedChannels, VoiceChannel, MessageEmbed, User, Guild, BaseGuildTextChannel} from 'discord.js';
import type {VoiceConnection, AudioPlayer} from '@discordjs/voice';
import type {SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandBooleanOption, SlashCommandUserOption} from '@discordjs/builders';
import type {Page} from 'discord.js-pages';
import type {LocaleObj} from './messages';
import type {Nullable} from 'discord-api-types/utils/internals';

export type GuildData = {triviaData: {isTriviaRunning: boolean}, queueHistory: PlayTrack[]};
export type PlayTrack = {previewUrl?: string, url: string, name: string, rawDuration: number, duration: string, timestamp: string, thumbnail: string, voiceChannel?: VoiceChannel, memberDisplayName: string, memberAvatar: string, artists: string[]};
export type Track = {name: string, url: string, artists: string[], previewUrl: string};
export type CustomAudioPlayer = {textChannel: TextBasedChannels | null, audioPlayer: AudioPlayer, loopTimes: number, nowPlaying?: PlayTrack, connection: VoiceConnection, loopSong: boolean, loopQueue: boolean, queue: PlayTrack[], commandLock: boolean, length: number, queueHistory: PlayTrack[]}

// TODO: Remove guildId and use guild.id
// TODO: Add channel for the text channel of the command
// TODO: Add voice channel for the voice channel of the user who run it
// TODO: Add user info
export type CommandInput<T = any> = {guild: Guild, sender: GuildMember, params: T, interaction?: CustomInteraction, messages: LocaleObj, guildId: string, message?: Message, channel: BaseGuildTextChannel};

export type Command = {deferred: boolean, execute: (input: CommandInput) => Promise<CommandReturn>, name: string, description: string, options?: OptionConfig[]};
export type CustomClient = Client;
export type CustomInteraction = Omit<CommandInteraction, 'deferReply'> & {guildId: string, client: CustomClient, guild: {client: CustomClient}, member: GuildMember, deferReply: (x?: {fetchReply: boolean}) => Promise<Message>};
export type YoutubeTrack = {title: string | undefined, url: string, thumbnail: {url: string | undefined}, durationFormatted: string, duration: number};
export type Playlist = {name: string, urls: PlayTrack[]};

export type SlashCommandOption = SlashCommandBooleanOption | SlashCommandIntegerOption | SlashCommandStringOption | SlashCommandUserOption;
export type BaseOptionConfig = {type: 'boolean' | 'integer' | 'string' | 'user', name: string, description: string, choices: string[]};
export type OptionConfig = BaseOptionConfig & ({required: false, default: any} | {required: true, default: never});
export type CommandReturn = string | {content: string} | {embeds: MessageEmbed[]} | {pages: {thumbnail?: string, listenTimeout?: number, pages: Page[], title?: string, color?: string, url?: string, author?: {username: string, avatar: string}}};

export type MessageFunction = (name: string, params?: any) => Promise<string>;

export type RAWGGameData = {
    background_image: string,
    name: string,
    developers: ({name: string})[],
    publishers: ({name: string})[],
    genres: ({name: string})[],
    redirect: boolean,
    id: string,
    tba: string,
    released: string,
    esrb_rating: {name: string} | null,
    description_raw: string,
    rating: string | null,
    platforms: ({platform: {name: string}})[],
    stores: ({store: {name: string}, url: string})[]
};

export type APODData = {
    copyright: string,
    date: string,
    explanation: string,
    hdurl: string,
    media_type: 'image',
    service_version: 'v1',
    title: string,
    url: string
};

export type COVIDWorldStats = {todayCases: number, todayDeaths: number, recovered: number, deaths: number, active: number, cases: number, tests: number, casesPerOneMillion: number, deathsPerOneMillion: number, updated: number};
export type COVIDCountryStats = COVIDWorldStats & {country: string, countryInfo: {flag: string}};
export type CryptoCoinData = {symbol: string, price: number[]};

export type DigimonInfo = {
    name: string,
    img: string,
    level: string,
};

export type FFXIVMountInfo = {
    id: number,
    name: string,
    description: string,
    enhanced_description: string,
    tooltip: string,
    movement: string,
    seats: number,
    order: number,
    order_group: number,
    patch: string,
    item_id: null,
    owned: string,
    image: string,
    icon: string,
    sources: {type: string, text: string, related_type: string, related_id: number}[]
};

export type IPLookupData = {query: string, city: string, zip: string, regionName: string, country: string, org: string, isp: string, as: string};
export type MotivationData = {quotes: ({text: string, author: string})[]};
export type ShowData = {
    show: Nullable<{
        runtime: string,
        name: string,
        summary: string,
        language: string,
        type: string,
        premiered: string,
        network: {
            country: {
                code: string
            }
            name: string,
        },
        rating: {
            average: string,
        },
        url: string,
        image: {
            original: string
        },
        genres: string[]
    }>
};

export type UrbanDictionaryData = {list: ({definition: string, permalink: string})[]};
export type WorldNewsData = {articles: ({title: string, url: string, author: string, description: string, urlToImage: string, publishedAt: number})[]};
export type SpeedrunStats = {runners: ({name: string, avatar: string})[], status :number};
export type SpeedrunnerStats = {pbs: ({id: string, realtime_duration_ms: number, realtime_sum_of_best_ms: number, program: string, parsed_at: number, attempts: any[], game: {cover_url: string, name: string}, category: {name: string}, segments: any[]})[], status :number};
