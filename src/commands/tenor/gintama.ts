// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fs = require('fs-extra');
const {randomEl} = require('../../utils/utils');

export const name = 'gintama';
export const description = 'Replies with a gintama gif!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    try {
        const linkArray = await fs.readFile('./resources/gifs/gintamalinks.txt', 'utf8').then((links) => links.split('\n'));
        const link = randomEl(linkArray);
        return interaction.reply(link);
    } catch(e) {
        console.error(e);
        return interaction.reply(':x: Failed to fetch a gintama gif!');
    }
};



/*
fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=gintama&limit=1`)
.then((res) => res.json())
.then((json) => message.channel.send(json.results[0].url))
.catch((e) => {
    console.error(e);
    return message.reply('Failed to fetch a gintama gif :slight_frown:');
})
*/
