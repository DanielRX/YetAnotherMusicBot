// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {joinVoiceChannel, VoiceConnectionStatus, entersState} = require('@discordjs/voice');
const {MessageEmbed} = require('discord.js');
const fs = require('fs-extra');
const TriviaPlayer = require('../../utils/music/TriviaPlayer');
const {getRandom} = require('../../utils/utils');
const {setupOption} = require('../../utils/utils');

const name = 'music-trivia';
const description = 'Engage in a music quiz with your friends!';

const options = [
    {name: 'length', description: 'How many songs would you like the trivia to have?', required: false, choices: []},
    {name: 'youtube', description: 'Use youtube for songs?', required: false, choices: []},
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addBooleanOption(setupOption(options[1]));

/**
 *
 *
 * @param {import('../..').CustomInteraction} interaction
 * @param {import('../..').CustomAudioPlayer} player
 */
const handleSubscription = async(interaction, player) => {
    const {queue} = player;
    let {voiceChannel} = queue[0];

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

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<import('discord.js').Message | import('discord-api-types').APIMessage>}
 */
const execute = async(interaction) => {
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

    const numberOfSongs = interaction.options.get('length') ? interaction.options.get('length').value : 5;
    const useYoutube = interaction.options.get('youtube') ? interaction.options.get('youtube').value : true;

    /** @type {({youtubeUrl: string, preview_url: string, artists: string[], album: string, name: string})[]} */
    const songs = await fs.readJSON('./resources/music/mk2/trivia.json');
    /** @type {{[key: string]: {}}} */
    const albumData = await fs.readJSON('./resources/music/mk2/albums.json');
    /** @type {{[key: string]: string}} */
    const artistsData = await fs.readJSON('./resources/music/mk2/artists.json');
    const videoDataArray = songs.map((track) => ({...track, album: albumData[track.album], artists: track.artists.map((id) => artistsData[id])}));
    // Get random numberOfSongs videos from the array

    const randomLinks = getRandom(videoDataArray, numberOfSongs);
    interaction.client.triviaManager.set(interaction.guildId, new TriviaPlayer(useYoutube));

    const triviaPlayer = interaction.client.triviaManager.get(interaction.guildId);

    randomLinks.forEach(({artists, name, preview_url, youtubeUrl}) => {
        triviaPlayer.queue.push({url: youtubeUrl, artists, preview_url, name, voiceChannel});
    });

    const membersInChannel = interaction.member.voice.channel.members;

    membersInChannel.each((user) => {
        if(user.user.bot) { return; }
        triviaPlayer.score.set(user.user.username, 0);
    });

    // play and display embed that says trivia started and how many songs are going to be
    return handleSubscription(interaction, triviaPlayer);
};

module.exports = {data, execute, name, description};
