// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');

const name = 'leave';
const description = 'Leaves a voice channel if in one!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
* @param {import('discord.js').CommandInteraction} interaction
* @returns {Promise<void>}
*/
const execute = async(interaction) => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) {
        return interaction.reply('Please join a voice channel and try again!');
    }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing || !player) {
        return interaction.reply('There is no song playing right now!');
    }
    if(voiceChannel.id !== interaction.guild.me.voice.channel.id) {
        return interaction.reply('You must be in the same voice channel as the bot in order to skip!');
    }

    player.connection.destroy();
    interaction.client.playerManager.delete(interaction.guildId);
    return interaction.reply('Left your voice channel!');
};

module.exports = {data, execute};

