// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');

const name = 'resume';
const description = 'Resume a paused track';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return interaction.reply('Please join a voice channel and try again!'); }

    const player = interaction.client.playerManager.get(interaction.guildId);
    if(!player) { return interaction.reply('There is no song playing right now!'); }
    if(player.audioPlayer.state.status == AudioPlayerStatus.Playing) { return interaction.reply('This song is not paused!'); }
    if(voiceChannel.id !== interaction.guild.me.voice.channel.id) { return interaction.reply('You must be in the same voice channel as the bot in order to resume!'); }

    const success = player.audioPlayer.unpause();

    if(success) { return interaction.reply(':play_pause: Track resumed!'); }
    return interaction.reply('I was unable to unpause this song, please try again soon');
};

module.exports = {data, execute, name, description};
