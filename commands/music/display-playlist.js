// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const {MessageEmbed} = require('discord.js');
const {setupOption} = require('../../utils/utils');

const name = 'display-playlist';
const description = 'Display a saved playlist';

const options = [
    {name: 'playlistname', description: 'What is the name of the playlist you would like to display?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
* @param {import('discord.js').CommandInteraction} interaction
* @returns {Promise<void>}
*/
const execute = async(interaction) => {
    interaction.deferReply();
    const playlistName = interaction.options.get('playlistname').value;
    // Check if user has playlists or if user is saved in the DB
    const userData = await Member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) {
        return interaction.followUp('You have zero saved playlists!'); //TODO: Swap to reply?
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length === 0) {
        return interaction.followUp('You have zero saved playlists!'); //TODO: Swap to reply?
    }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) {
        const urlsArrayClone = savedPlaylistsClone[location].urls;
        if(urlsArrayClone.length === 0) {
            return interaction.followUp(`**${playlistName}** is empty!`); //TODO: Swap to reply?
        }
        const savedPlaylistEmbed = new MessageEmbed()
            .setColor('#ff7373')
            .setTitle(playlistName)
            .setTimestamp();
        const fields = urlsArrayClone.slice(0, 24).map((x, i) => ({name: `${i + 1}`, value: `${x.title}`}));
        savedPlaylistEmbed.setFields(fields);

        return interaction.followUp({embeds: [savedPlaylistEmbed]}); //TODO: Swap to reply?
    }
    return interaction.followUp(`You have no playlist named ${playlistName}`); //TODO: Swap to reply?
};

module.exports = {data, execute};
