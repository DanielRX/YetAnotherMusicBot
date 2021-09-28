import {joinVoiceChannel, VoiceConnectionStatus, entersState} from '@discordjs/voice';
import type {APIMessage} from 'discord-api-types';
import type {BaseGuildTextChannel, Message} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import fs from 'fs-extra';
import {playerManager, triviaManager} from '../../utils/client';
import TriviaPlayer from '../../utils/music/TriviaPlayer';
import type {CustomInteraction} from '../../utils/types';
import {logger} from '../../utils/logging';

import {getRandom} from '../../utils/utils';

export const name = 'music-trivia';
export const description = 'Engage in a music quiz with your friends!';

export const options = [
    {type: 'string' as const, name: 'length', description: 'How many songs would you like the trivia to have?', required: false, choices: [], default: 25}
];

type TriviaElement = {youtubeUrl: string, previewUrl: string, artists: string[], album: string, name: string, id: string};

const handleSubscription = async(interaction: CustomInteraction, player: TriviaPlayer): Promise<APIMessage | Message> => {
    const {queue} = player;
    const {voiceChannel} = queue[0];

    const connection = joinVoiceChannel({channelId: voiceChannel?.id ?? '', guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator});

    player.textChannel = interaction.channel as BaseGuildTextChannel;
    player.passConnection(connection);
    try {
        await entersState(player.connection, VoiceConnectionStatus.Ready, 10000);
    } catch(e: unknown) {
        logger.error(e);
        return interaction.followUp({content: 'Failed to join your channel!'});
    }
    void player.process(player.queue);

    const triviaDescription = `:notes: Get ready! There are ${queue.length} songs, you have 30 seconds to guess either the singer/band or the name of the song. Good luck!
    Vote skip the song by entering the word 'skip'.
    You can end the trivia at any point by using the end-trivia command!`;

    const startTriviaEmbed = new MessageEmbed().setColor('#ff7373').setTitle(':notes: Starting Music Quiz!').setDescription(triviaDescription);
    return interaction.followUp({embeds: [startTriviaEmbed]});
};

export const execute = async(interaction: CustomInteraction, length: number): Promise<APIMessage | Message> => {
    await interaction.deferReply();
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) {
        return interaction.followUp(':no_entry: Please join a voice channel and try again!');
    }

    if(playerManager.get(interaction.guildId)) {
        return interaction.followUp(`You can't use this while a track is playing!`);
    }

    if(triviaManager.get(interaction.guildId)) {
        return interaction.followUp('There is already a trivia in play!');
    }

    const songs = await fs.readJSON('./resources/music/mk2/trivia.json') as TriviaElement[]; // TODO: Move type to types
    const albumData = await fs.readJSON('./resources/music/mk2/albums.json') as {[key: string]: {[key: string]: unknown}};
    const artistsData = await fs.readJSON('./resources/music/mk2/artists.json') as {[key: string]: string};
    const videoDataArray = songs.map((track) => ({...track, album: albumData[track.album], artists: track.artists.map((id) => artistsData[id])}));
    // Get random numberOfSongs videos from the array

    const randomLinks = getRandom(videoDataArray, length);
    triviaManager.set(interaction.guildId, new TriviaPlayer());

    const triviaPlayer = triviaManager.get(interaction.guildId) as unknown as TriviaPlayer;

    // eslint-disable-next-line @typescript-eslint/no-shadow
    randomLinks.forEach(({artists, name, previewUrl, youtubeUrl, id}) => {
        triviaPlayer.queue.push({url: youtubeUrl, artists, previewUrl, name, voiceChannel, id} as any);
    });

    const membersInChannel = interaction.member.voice.channel?.members;

    membersInChannel?.each((user) => {
        if(user.user.bot) { return; }
        triviaPlayer.score.set(user.user.username, 0);
    });

    // play and display embed that says trivia started and how many songs are going to be
    return handleSubscription(interaction, triviaPlayer);
};

