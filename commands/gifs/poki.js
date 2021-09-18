//@ts-check

const {CommandInteraction} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const fetch = require('node-fetch');
const {tenorAPI} = require('../../config.json');

if(!tenorAPI) { return; }

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokimane')
        .setDescription('Responds with a random pokimane gif'),
    /**
     * @param {CommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=pokimane&limit=50`)
            .then((res) => res.json())
            .then((json) => interaction.reply(json.results[Math.floor(Math.random() * 49)].url))
            .catch(function onError() {
                return interaction.reply(':x: Failed to find a gif!');
            });
    }
};