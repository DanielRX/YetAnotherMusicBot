import {SlashCommandBuilder} from '@discordjs/builders';
import {joinVoiceChannel, VoiceConnectionStatus, entersState} from '@discordjs/voice';
import type {APIMessage} from 'discord-api-types';
import type {Message} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import fs from 'fs-extra';
import TriviaPlayer from '../../utils/music/TriviaPlayer';
import type {CustomAudioPlayer, CustomInteraction} from '../../utils/types';
import {getRandom, setupOption} from '../../utils/utils';

export const name = 'music-trivia';
export const description = 'Engage in a music quiz with your friends!';

export const options = [
    {name: 'length', description: 'How many songs would you like the trivia to have?', required: false, choices: []},
    {name: 'youtube', description: 'Use youtube for songs?', required: false, choices: []},
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addBooleanOption(setupOption(options[1]));

const handleSubscription = async(interaction: CustomInteraction, player: CustomAudioPlayer): Promise<Message | APIMessage> => {
    const {queue} = player;
    const {voiceChannel} = queue[0];

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
    });

    player.textChannel = interaction.channel;
    player.passConnection(connection);
    try {
        await entersState(player.connection, VoiceConnectionStatus.Ready, 10000);
    } catch(err) {
        console.error(err);
        return interaction.followUp({content: 'Failed to join your channel!'});
    }
    player.process(player.queue);

    const startTriviaEmbed = new MessageEmbed()
        .setColor('#ff7373')
        .setTitle(':notes: Starting Music Quiz!')
        .setDescription(`:notes: Get ready! There are ${queue.length} songs, you have 30 seconds to guess either the singer/band or the name of the song. Good luck!
    Vote skip the song by entering the word 'skip'.
    You can end the trivia at any point by using the end-trivia command!`);
    return interaction.followUp({embeds: [startTriviaEmbed]});
};

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message> => {
    await interaction.deferReply();
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) {
        return interaction.followUp(':no_entry: Please join a voice channel and try again!');
    }

    if(interaction.client.playerManager.get(interaction.guildId)) {
        return interaction.followUp(`You can't use this while a track is playing!`);
    }

    if(interaction.client.triviaManager.get(interaction.guildId)) {
        return interaction.followUp('There is already a trivia in play!');
    }

    const numberOfSongs = Number(interaction.options.get('length') ? interaction.options.get('length')?.value : 5);
    const useYoutube = Boolean(interaction.options.get('youtube') ? interaction.options.get('youtube')?.value : false);

    const songs: ({youtubeUrl: string, preview_url: string, artists: string[], album: string, name: string})[] = await fs.readJSON('./resources/music/mk2/trivia.json'); // TODO: Move type to types
    const albumData: {[key: string]: {}} = await fs.readJSON('./resources/music/mk2/albums.json');
    const artistsData: {[key: string]: string} = await fs.readJSON('./resources/music/mk2/artists.json');
    const videoDataArray = songs.map((track) => ({...track, album: albumData[track.album], artists: track.artists.map((id) => artistsData[id])}));
    // Get random numberOfSongs videos from the array

    const randomLinks = getRandom(videoDataArray, numberOfSongs);
    interaction.client.triviaManager.set(interaction.guildId, new TriviaPlayer(useYoutube));

    const triviaPlayer = interaction.client.triviaManager.get(interaction.guildId);

    randomLinks.forEach(({artists, name, preview_url, youtubeUrl}) => {
        triviaPlayer.queue.push({url: youtubeUrl, artists, preview_url, name, voiceChannel});
    });

    const membersInChannel = interaction.member.voice.channel?.members;

    membersInChannel?.each((user) => {
        if(user.user.bot) { return; }
        triviaPlayer?.score.set(user.user.username, 0);
    });

    // play and display embed that says trivia started and how many songs are going to be
    return handleSubscription(interaction, triviaPlayer);
};

