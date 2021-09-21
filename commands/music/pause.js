// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');

const name = 'pause';
const description = 'Pause the playing track';

/**
 * @param {import('../../').CustomInteraction} interaction
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

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = (interaction) => interaction.reply(exec(interaction));

module.exports = {data, execute, name, description};
