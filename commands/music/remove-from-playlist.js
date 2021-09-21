// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const {setupOption} = require('../../utils/utils');

const name = 'remove-from-playlist';
const description = 'Remove a song from a saved playlist';

const options = [
    {name: 'playlist', description: 'What is the playlist you would like to delete a song from?', required: true, choices: []},
    {name: 'index', description: 'What is the index of the video you would like to delete from your saved playlist?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addStringOption(setupOption(options[1]));

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<import('discord.js').Message | import('discord-api-types').APIMessage>}
 */
const execute = async(interaction) => {
    await interaction.deferReply();

    const playlistName = interaction.options.get('playlist').value;
    const index = interaction.options.get('index').value;

    const userData = await Member.findOne({
        memberId: interaction.member.id
    }).exec();
    if(!userData) {
        return interaction.followUp('You have no custom playlists!');
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) {
        return interaction.followUp('You have no custom playlists!');
    }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location !== -1) {
        const urlsArrayClone = savedPlaylistsClone[location].urls;
        if(urlsArrayClone.length == 0) {
            return interaction.followUp(`**${playlistName}** is empty!`);
        }
        if(index > urlsArrayClone.length) {
            return interaction.followUp(`The index you provided is larger than the playlist's length`);
        }
        const title = urlsArrayClone[index - 1].title;
        urlsArrayClone.splice(index - 1, 1);
        savedPlaylistsClone[location].urls = urlsArrayClone;
        void Member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();

        return interaction.followUp(`I removed **${title}** from **${savedPlaylistsClone[location].name}**`);
    }
    return interaction.followUp(`You have no playlist named ${playlistName}`);
};

module.exports = {data, execute, name, description};
