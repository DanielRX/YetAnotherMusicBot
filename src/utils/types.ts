import type {Client, GuildMember, CommandInteraction, Message, TextBasedChannels, VoiceChannel, MessageEmbed} from 'discord.js';
import type {VoiceConnection, AudioPlayer} from '@discordjs/voice';
import type {SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandBooleanOption, SlashCommandUserOption} from '@discordjs/builders';

export type GuildData = {triviaData: {isTriviaRunning: boolean}, queueHistory: PlayTrack[]};
export type PlayTrack = {previewUrl?: string, url: string, name: string, rawDuration: number, duration: string, timestamp: string, thumbnail: string, voiceChannel?: VoiceChannel, memberDisplayName: string, memberAvatar: string, artists: string[]};
export type Track = {name: string, url: string, artists: string[], previewUrl: string};
export type CustomAudioPlayer = {textChannel: TextBasedChannels | null, audioPlayer: AudioPlayer, loopTimes: number, nowPlaying?: PlayTrack, connection: VoiceConnection, loopSong: boolean, loopQueue: boolean, queue: PlayTrack[], commandLock: boolean, length: number, queueHistory: PlayTrack[]}

export type Command = {deferred: boolean, execute: (interaction: CustomInteraction, params?: any) => Promise<void>, name: string, description: string, options?: OptionConfig[]};
export type CustomClient = Client;
export type CustomInteraction = Omit<CommandInteraction, 'deferReply'> & {guildId: string, client: CustomClient, guild: {client: CustomClient}, member: GuildMember, deferReply: (x?: {fetchReply: boolean}) => Promise<Message>};
export type YoutubeTrack = {title: string | undefined, url: string, thumbnail: {url: string | undefined}, durationFormatted: string, duration: number};
export type Playlist = {name: string, urls: PlayTrack[]};

export type SlashCommandOption = SlashCommandBooleanOption | SlashCommandIntegerOption | SlashCommandStringOption | SlashCommandUserOption;
export type BaseOptionConfig = {type: 'boolean' | 'integer' | 'string' | 'user', name: string, description: string, choices: string[]};
export type OptionConfig = BaseOptionConfig & ({required: false, default: any} | {required: true, default: never});
export type CommandReturn = string | {content: string} | {embeds: MessageEmbed[]} | void;
