//@ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fetch} = require('../../utils/utils');
const {tenorAPI} = require('../../utils/config');

export const name = 'animegif';
export const description = 'Responds with a random anime gif';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const executeexecute = async(interaction) => {
    if(!tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }
    void fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=anime&limit=50`)
        .then((res) => res.json())
        .then((json) => interaction.reply(json.results[Math.floor(Math.random() * 49)].url))
        .catch(() => {
            return interaction.reply(':x: Failed to find a gif!');
        });
};


