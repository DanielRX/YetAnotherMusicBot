// @ts-check

const {SlashCommandBuilder} = require('@discordjs/builders');
const Member = require('../../utils/models/Member');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-playlist')
        .setDescription('Delete a playlist from your saved playlists')
        .addStringOption((option) =>
            option
                .setName('playlistname')
                .setDescription('Which playlist would you like to delete?')
                .setRequired(true)),
    async execute(interaction) {
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
            interaction.reply(`You have no playlist named ${playlistName}`);
        } else {
            savedPlaylistsClone.splice(location, 1);
            await Member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone});
            interaction.reply(`I removed **${playlistName}** from your saved playlists!`);
        }
    }
};
