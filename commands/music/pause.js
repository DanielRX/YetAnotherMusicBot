// @ts-check

const {CommandInteraction} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');


/**
 * @param {CommandInteraction} interaction
 * @returns {string}
 */
const exec = (interaction) => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) {
        return 'Please join a voice channel and try again!';
    }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if(!player) {
        return 'There is no song playing right now!';
    }
    if(player.audioPlayer.state.status === AudioPlayerStatus.Paused) {
        return 'You already paused this song!';
    }
    if(voiceChannel.id !== interaction.guild.me.voice.channel.id) {
        return 'You must be in the same voice channel as the bot in order to pause!';
    }

    const success = player.audioPlayer.pause();

    if(success) {
        return ':pause_button: Song was paused! To unpause, use the resume command';
    }
    return 'I was unable to pause this song, please try again soon';
};

module.exports.data = new SlashCommandBuilder().setName('pause').setDescription('Pause the playing track');

/**
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
module.exports.execute = (interaction) => interaction.reply(exec(interaction));
