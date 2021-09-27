import {Client, Collection, Intents} from 'discord.js';
import type {Command, CustomAudioPlayer, CustomClient, GuildData} from '../utils/types';
import type TriviaPlayer from './music/TriviaPlayer';

const intents = [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES];

export const client = new Client({intents}) as unknown as CustomClient;

export const playerManager: Map<string, CustomAudioPlayer> = new Map();
export const triviaManager: Map<string, TriviaPlayer> = new Map();
export const guildData: Map<string, GuildData> = new Collection();
export const commands: Collection<string, Command> = new Collection();
