// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fetch} = require('../../utils/utils');
const {tenorAPI} = require('../../utils/config');

export const name = 'cat';
export const description = 'Replies with a cute cat picture!';

export const datast data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    if(!tenorAPI) { return interaction.reply(':x: Tenor commands are not enabled'); }

    return fetch(`https://api.tenor.com/v1/random?key=${tenorAPI}&q=cat&limit=1`)
        .then((res) => res.json())
        .then((json) => interaction.reply({content: json.results[0].url}))
        .catch(async(err) => {
            console.error(err);
            return interaction.reply(':x: Request to find a kitty failed!');
        });
};


