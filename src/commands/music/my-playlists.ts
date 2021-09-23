// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const Member = require('../../utils/models/Member');
const {MessageEmbed} = require('discord.js');

const name = 'my-playlists';
const description = 'Lists your saved playlists';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
* @param {import('../../').CustomInteraction} interaction
* @returns {Promise<import('discord.js').Message | import('discord-api-types').APIMessage>}
*/
const execute = async(interaction) => {
    void interaction.deferReply();

    const userData = await Member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) {
        return interaction.followUp('You have zero saved playlists!');
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) {
        return interaction.followUp('You have zero saved playlists!');
    }
    const fields = savedPlaylistsClone.map((playlist, i) => ({name: `${i + 1}`, value: playlist.name, inline: true}));
    const playlistsEmbed = new MessageEmbed()
        .setTitle('Your saved playlists')
        .setFields(fields)
        .setTimestamp();

    return interaction.followUp({embeds: [playlistsEmbed]});
};

module.exports = {data, execute, name, description};
