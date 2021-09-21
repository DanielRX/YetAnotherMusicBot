//@ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fetch = require('node-fetch');
const {tenorAPI} = require('../../config.json');

const name = 'pokimane';
const description = 'Responds with a random pokimane gif!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    if(!tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=pokimane&limit=50`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[Math.floor(Math.random() * 49)].url))
        .catch(function onError() {
            return interaction.reply(':x: Failed to find a gif!');
        });
};

module.exports = {data, execute};
