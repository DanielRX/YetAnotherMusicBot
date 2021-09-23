// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {PagesBuilder} = require('discord.js-pages');

export const name = 'queue';
export const descriptionription = 'Display the music queue';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<import('discord.js').Message | import('discord-api-types').APIMessage>}
 */
export const execute = async(interaction) => {
    await interaction.deferReply();
    const guildData = interaction.client.guildData.get(interaction.guildId);
    if(guildData && guildData.triviaData.isTriviaRunning) {
        return interaction.followUp(':x: Try again after the trivia has ended!');
    }
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player && player.queue.length == 0) {
        return interaction.followUp(':x: There are no songs in queue!');
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

    void new PagesBuilder(interaction)
        .setTitle('Music Queue')
        .setPages(embeds)
        .setListenTimeout(2 * 60 * 1000)
        .setColor('#9096e6')
        .setAuthor(interaction.member.user.username, interaction.member.user.displayAvatarURL())
        .build();
};



