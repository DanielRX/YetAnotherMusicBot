// @ts-check
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
     * @param {import('../../').CustomInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=dog&limit=1`)
            .then((res) => res.json())
            .then((json) => interaction.reply(json.results[0].url))
            .catch(async(err) => {
                await interaction.reply(':x: Request to find a doggo failed!');
                return console.error(err);
            });
    }
};