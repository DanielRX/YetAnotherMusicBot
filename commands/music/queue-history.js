// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {PagesBuilder} = require('discord.js-pages');

const name = 'queue-history';
const description = 'Display the music queue history';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
* @param {import('discord.js').CommandInteraction} interaction
* @returns {Promise<void>}
*/
const execute = async(interaction) => {
    const guildData = interaction.client.guildData.get(interaction.guildId);
    if(!guildData) {
        return interaction.followUp('There is no music queue history!');
    }
    if(guildData && !guildData.queueHistory.length) {
        return interaction.followUp('There is no music queue history!');
    }

    const queueClone = Array.from(guildData.queueHistory);
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

