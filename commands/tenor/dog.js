// @ts-check

const {CommandInteraction} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const fetch = require('node-fetch');
const {tenorAPI} = require('../../config.json');

// Skips loading if not found in config.json
if(!tenorAPI) { return; } // TODO: Fix, won't play nice with ts

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Replies with a cute dog picture!'),
    /**
     * @param {CommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=dog&limit=1`)
            .then((res) => res.json())
            .then((json) => interaction.reply(json.results[0].url))
            .catch((err) => {
                interaction.reply(':x: Request to find a doggo failed!');
                return console.error(err);
            });
    }
};
