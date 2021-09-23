//@ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {tenorAPI} = require('../../utils/config');
const {setupOption, fetch} = require('../../utils/utils');

const name = 'gif';
const description = 'Replies with a gif matching your query!';

const options = [
    {name: 'gif', description: 'What gif would you like to search for?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    if(!tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    const gif = interaction.options.get('gif').value;
    fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=${gif}&limit=1`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[0].url))
        .catch(() => {
            // console.error(e); // if you uncomment this, add an 'e' parameter to onError
            return interaction.reply(':x: Failed to find a gif that matched your query!');
        });
};

module.exports = {data, execute, name, description};
