import type {Client, Collection, GuildMember, CommandInteraction, Message, TextBasedChannels} from 'discord.js';
import type {VoiceConnection, AudioPlayer} from '@discordjs/voice';
import type {SlashCommandBuilder} from '@discordjs/builders';
import type {TriviaPlayer} from './music/TriviaPlayer';

export type GuildData = {triviaData: {isTriviaRunning: boolean}, queueHistory: PlayTrack[]};
export type PlayTrack = {preview_url?: string, url: string, name: string, rawDuration: number, duration: string, timestamp: string, thumbnail: string, voiceChannel: any, memberDisplayName: string, memberAvatar: string, artists: string[]};
export type Track = {name: string, url: string, artists: string[], preview_url: string};
export type CustomAudioPlayer = {textChannel: TextBasedChannels | null, audioPlayer: AudioPlayer, loopTimes: number, nowPlaying?: PlayTrack, connection: VoiceConnection, loopSong: boolean, loopQueue: boolean, queue: PlayTrack[], commandLock: boolean, length: number, queueHistory: PlayTrack[]}

export type Command = {data: SlashCommandBuilder, execute: (interaction: CustomInteraction) => Promise<void>}
export type CustomClient = Client & {playerManager: Map<string, CustomAudioPlayer>; commands: Collection<string, Command>, guildData: Map<string, GuildData>, triviaManager: Map<string, TriviaPlayer>};
export type CustomInteraction = Omit<CommandInteraction, 'deferReply'> & {guildId: string, client: CustomClient, guild: {client: CustomClient}, member: GuildMember, deferReply: (x?: {fetchReply: boolean}) => Promise<Message>};
export type YoutubeTrack = {title: string | undefined, url: string, thumbnail: {url: string | undefined}, durationFormatted: string, duration: number};
