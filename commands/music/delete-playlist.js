// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const {setupOption} = require('../../utils/utils');

const name = 'delete-playlist';
const description = 'Delete a playlist from your saved playlists';

const options = [
    {name: 'playlistname', description: 'Which playlist would you like to delete?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
* @param {import('discord.js').CommandInteraction} interaction
* @returns {Promise<void>}
*/
const execute = async(interaction) => {
    const playlistName = interaction.options.get('playlistname').value;
    // Check if user has playlists or if user is saved in the DB
    const userData = await Member.findOne({memberId: interaction.member.id}).exec();

    if(!userData) {
        return interaction.reply('You have zero saved playlists!');
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length === 0) {
        return interaction.reply('You have zero saved playlists!');
    }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) {
        return interaction.reply(`You have no playlist named ${playlistName}`);
    }
    savedPlaylistsClone.splice(location, 1);
    await Member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone});
    return interaction.reply(`I removed **${playlistName}** from your saved playlists!`);
};

module.exports = {data, execute};
