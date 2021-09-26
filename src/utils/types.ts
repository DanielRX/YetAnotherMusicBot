import type {Client, Collection, GuildMember, CommandInteraction, Message} from 'discord.js';
import type {VoiceConnection, AudioPlayer} from '@discordjs/voice';
import type {SlashCommandBuilder} from '@discordjs/builders';
import type {TriviaPlayer} from './music/TriviaPlayer';

export type GuildData = {triviaData: {isTriviaRunning: boolean}, queueHistory: Track[]};
export type PlayTrack = {url: string, title: string, rawDuration: string, duration: string, timestamp: string, thumbnail: string, voiceChannel: any, memberDisplayName: string, memberAvatar: string};
export type Artist = {name: string};
export type Track = {name: string, url: string, artists: string[], preview_url: string};
export type CustomAudioPlayer = {audioPlayer: AudioPlayer, loopTimes: number, nowPlaying?: {title: string}, connection: VoiceConnection, loopSong: boolean, loopQueue: boolean, queue: PlayTrack[], commandLock: boolean, length: number, queueHistory: PlayTrack[]}

export type Command = {data: SlashCommandBuilder, execute: (interaction: CustomInteraction) => Promise<void>}
export type CustomClient = Client & {playerManager: Map<string, CustomAudioPlayer>; commands: Collection<string, Command>, guildData: Map<string, GuildData>, triviaManager: Map<string, TriviaPlayer>};
export type CustomInteraction = Omit<CommandInteraction, 'deferReply'> & {guildId: string, client: CustomClient, guild: {client: CustomClient}, member: GuildMember, deferReply: (x?: {fetchReply: boolean}) => Promise<Message>};
