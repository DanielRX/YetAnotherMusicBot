// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fetch = require('node-fetch');
const {tenorAPI} = require('../../config.json');

const name = 'dog';
const description = 'Replies with a cute dog picture!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    if(!tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }

    fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=dog&limit=1`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[0].url))
        .catch(async(err) => {
            await interaction.reply(':x: Request to find a doggo failed!');
            return console.error(err);
        });
};

module.exports = {data, execute};
