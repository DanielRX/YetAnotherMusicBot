import {joinVoiceChannel, VoiceConnectionStatus, entersState} from '@discordjs/voice';
import type {BaseGuildTextChannel} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import fs from 'fs-extra';
import {playerManager, triviaManager} from '../../utils/client';
import TriviaPlayer from '../../utils/music/TriviaPlayer';
import type {CustomInteraction, CommandReturn, MessageFunction} from '../../utils/types';
import {logger} from '../../utils/logging';

import {getRandom} from '../../utils/utils';

export const name = 'music-trivia';
export const description = 'Engage in a music quiz with your friends!';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'length', description: 'How many songs would you like the trivia to have?', required: false, choices: [], default: 25},
    {type: 'boolean' as const, name: 'hard', description: 'Super strict answer mode', required: false, choices: [], default: false},
    {type: 'boolean' as const, name: 'round-mode', description: 'Play forever with rounds', required: false, choices: [], default: false},
    {type: 'string' as const, name: 'twitch-channel', description: 'Which twitch channel would you like to listen to?', required: false, choices: [], default: ''},
];

type TriviaElement = {youtubeUrl: string, previewUrl: string, artists: string[], album: string, name: string, id: string};

const handleSubscription = async(interaction: CustomInteraction, player: TriviaPlayer, desc: string, errorMsg: string): Promise<CommandReturn> => {
    const {queue} = player;
    const {voiceChannel} = queue[0];

    const connection = joinVoiceChannel({channelId: voiceChannel?.id ?? '', guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator});

    player.textChannel = interaction.channel as BaseGuildTextChannel;
    player.passConnection(connection);
    try {
        await entersState(player.connection, VoiceConnectionStatus.Ready, 10000);
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(errorMsg);
    }
    void player.process(player.queue);

    const startTriviaEmbed = new MessageEmbed().setColor('#ff7373').setTitle(':notes: Starting Music Quiz!').setDescription(desc);
    return {embeds: [startTriviaEmbed]};
};

export const execute = async(interaction: CustomInteraction, message: MessageFunction, length: number, hardMode: boolean, roundMode: boolean, twitchChannel: string): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return message('NOT_IN_VC'); }
    if(playerManager.has(interaction.guildId)) { return message('TRACK_IS_PLAYING'); }
    if(triviaManager.has(interaction.guildId)) { return message('TRIVIA_IS_RUNNING'); }

    const songs = await fs.readJSON('./resources/music/mk2/trivia.json') as TriviaElement[]; // TODO: Move type to types
    const albumData = await fs.readJSON('./resources/music/mk2/albums.json') as {[key: string]: {[key: string]: unknown}};
    const artistsData = await fs.readJSON('./resources/music/mk2/artists.json') as {[key: string]: string};
    const videoDataArray = songs.map((track) => ({...track, album: albumData[track.album], artists: track.artists.map((id) => artistsData[id])}));
    // Get random numberOfSongs videos from the array

    const randomLinks = getRandom(videoDataArray, length);
    triviaManager.set(interaction.guildId, new TriviaPlayer(hardMode, roundMode, twitchChannel, voiceChannel));

    const triviaPlayer = triviaManager.get(interaction.guildId) as unknown as TriviaPlayer;

    // eslint-disable-next-line @typescript-eslint/no-shadow
    randomLinks.forEach(({artists, name, previewUrl, youtubeUrl, id}) => {
        triviaPlayer.queue.push({url: youtubeUrl, artists, previewUrl, name, voiceChannel, id} as any);
    });

    const membersInChannel = interaction.member.voice.channel?.members;

    membersInChannel?.each((user) => {
        if(user.user.bot) { return; }
        triviaPlayer.score.set(`d:${user.user.username.toLowerCase()}`, 0);
    });

    // play and display embed that says trivia started and how many songs are going to be
    return handleSubscription(interaction, triviaPlayer, await message('START', {length: triviaPlayer.queue.length}), await message('FAILED_TO_JOIN'));
};

