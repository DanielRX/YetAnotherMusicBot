// @ts-check
const {CommandInteraction} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const Member = require('../../utils/models/Member');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-playlist')
        .setDescription('Create a custom playlist that you can play anytime')
        .addStringOption((option) =>
            option
                .setName('playlistname')
                .setDescription('What is the name of the playlist you would like to create?')
                .setRequired(true)),
    /**
     * @param {CommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        const playlistName = interaction.options.get('playlistname').value;
        // Check if the user exists in the db
        const userData = await Member.findOne({memberId: interaction.member.id}).exec(); // A clone object
        if(!userData) {
            const userObject = {
                memberId: interaction.member.id,
                username: interaction.member.user.username,
                joinedAt: interaction.member.joinedAt,
                savedPlaylists: [{name: playlistName, urls: []}]
            };
            const user = new Member(userObject);
            user.save((err) => {
                if(err) { return interaction.reply('An error has occured, please try again later'); }
            });
            return interaction.reply(`Created a new playlist named **${playlistName}**`);
        }
        // Make sure the playlist name isn't a duplicate
        if(userData.savedPlaylists.filter((playlist) => playlist.name == playlistName).length > 0) {
            return interaction.reply(`There is already a playlist named **${playlistName}** in your saved playlists!`);
        }

        // Create and save the playlist in the DB
        userData.savedPlaylists.push({name: playlistName, urls: []});
        try {
            await Member.updateOne({memberId: interaction.member.id}, userData);
            return interaction.reply(`Created a new playlist named **${playlistName}**`);
        } catch(e) {
            console.error(e);
            return interaction.reply('There was a problem executing this command, please try again later');
        }
    }
};
