// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {AudioPlayerStatus} = require('@discordjs/voice');
const createGuildData = require('../../utils/createGuildData');

const {setupOption} = require('../../utils/utils');

const name = 'loopqueue';
const description = 'Loop the queue x times! - (the default is 1 time)';

const options = [
    {name: 'looptimes', description: 'How many times do you want to loop the queue?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addIntegerOption(setupOption(options[0]));

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    if(!interaction.client.guildData.get(interaction.guildId)) {
        interaction.client.guildData.set(interaction.guildId, createGuildData());
    }
    const guildData = interaction.client.guildData.get(interaction.guildId);
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(!player) {
        return interaction.reply('There is no song playing now!');
    }
    if(player.audioPlayer.state.status !== AudioPlayerStatus.Playing) {
        return interaction.reply('There is no song playing now!');
    }
    if(player.audioPlayer.state.status === AudioPlayerStatus.Playing && guildData.triviaData.isTriviaRunning) {
        return interaction.reply(`You can't use this command while a trivia is running!`);
    }
    if(interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) {
        return interaction.reply(`You must be in the same voice channel as the bot in order to use that!`);
    }
    if(player.loopSong) {
        return interaction.reply(':x: Turn off the **loop** command before using the **loopqueue** command');
    }

    const looptimes = (interaction.options.get('looptimes') ?? {value: 1}).value;

    if(player.loopQueue) {
        player.loopQueue = false;
        return interaction.reply(':repeat: The queue is no longer playing on **loop**');
    }
    player.loopQueue = true;
    return interaction.reply(':repeat: The queue is now playing on **loop**');
};

module.exports = {data, execute};
