// @ts-check

const {SlashCommandBuilder} = require('@discordjs/builders');
const {shuffleArray} = require('../../utils/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the music queue!'),

    execute(interaction) {
        interaction.deferReply();
        const voiceChannel = interaction.member.voice.channel;
        if(!voiceChannel) {
            return interaction.followUp(`:no_entry: You must be in the same voice channel as the bot in order to use that!`);
        }
        if(voiceChannel.id !== interaction.guild.me.voice.channel.id) {
            return interaction.followUp(`:no_entry: You must be in the same voice channel as the bot in order to use that!`);
        }
        const player = interaction.client.playerManager.get(interaction.guildId);
        if(!player) {
            return interaction.followUp(':x: There is nothing playing right now!');
        }
        if(player.loopSong) {
            return interaction.followUp(':x: Turn off the **loop** command before using the **shuffle** command!');
        }

        if(player.queue.length < 1) {
            return interaction.followUp('There are no songs in queue!');
        }

        if(player.commandLock) {
            return interaction.followUp('Please wait until play command is done processing');
        }

        shuffleArray(player.queue);

        return interaction.followUp('The music queue has been shuffled!');
    }
};

