// @ts-check
const fetch = require('node-fetch');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bored')
        .setDescription('Generate a random activity!'),
    /**
     * @param {import('../../').CustomInteraction} interaction
     * @returns {Promise<void>}
     */
    execute(interaction) {
        return fetch('https://www.boredapi.com/api/activity?participants=1')
            .then((res) => res.json())
            .then((json) => {
                const embed = new MessageEmbed()
                    .setColor('#6BA3FF')
                    .setAuthor('Bored Activites', 'https://i.imgur.com/7Y2F38n.png', 'https://www.boredapi.com/')
                    .setDescription(json.activity)
                    .setTimestamp()
                    .setFooter('Powered by boredapi.com', '');
                return interaction.reply({embeds: [embed]});
            })
            .catch((err) => {
                console.error(err);
                return interaction.reply('Failed to deliver activity :sob:');
            });
    }
};
