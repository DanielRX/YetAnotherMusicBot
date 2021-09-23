//@ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fetch} = require('../../utils/utils');
const {tenorAPI} = require('../../utils/config');

export const name = 'pokimane';
export const description = 'Responds with a random pokimane gif!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    if(!tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    return fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=pokimane&limit=50`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[Math.floor(Math.random() * 49)].url))
        .catch(() => interaction.reply(':x: Failed to find a gif!'));
};


