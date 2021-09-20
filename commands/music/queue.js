// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {PagesBuilder} = require('discord.js-pages');

const name = 'queue';
const description = 'Display the music queue';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
* @param {import('discord.js').CommandInteraction} interaction
* @returns {Promise<void>}
*/
const execute = async(interaction) => {
    await interaction.deferReply();
    const guildData = interaction.client.guildData.get(interaction.guildId);
    if(guildData) {
        if(guildData.triviaData.isTriviaRunning) {
            return interaction.followUp(':x: Try again after the trivia has ended!');
        }
    }
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player) {
        if(player.queue.length == 0) {
            return interaction.followUp(':x: There are no songs in queue!');
        }
    }
    if(!player) {
        return interaction.followUp(':x: There is nothing playing right now!');
    }

    const queueClone = Array.from(player.queue);
    const embeds = [];

    for(let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
        const fields = queueClone
            .slice(i * 24, 24 + i * 24)
            .filter((e) => e)
            .map((e, j) => ({name: `${j + 1 + i * 24}`, value: `${e.title}`}));

        embeds.push(new MessageEmbed().setTitle(`Page ${i}`).setFields(fields));
    }

    new PagesBuilder(interaction)
        .setTitle('Music Queue')
        .setPages(embeds)
        .setListenTimeout(2 * 60 * 1000)
        .setColor('#9096e6')
        .setAuthor(interaction.member.user.username, interaction.member.user.displayAvatarURL())
        .build();
};

module.exports = {data, execute};

