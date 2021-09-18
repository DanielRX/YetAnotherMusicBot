// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fs = require('fs-extra');
const {randomEl} = require('../../utils/utils');

const name = 'jojo';
const description = 'Replies with a random jojo gif!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
* @param {import('discord.js').CommandInteraction} interaction
* @returns {Promise<void>}
*/
const execute = async(interaction) => {
    try {
        const linkArray = await fs.readFile('./resources/gifs/jojolinks.txt', 'utf8').then((links) => links.split('\n'));
        const link = randomEl(linkArray);
        return interaction.reply(link);
    } catch(e) {
        console.error(e);
        return interaction.reply(':x: Failed to fetch a gif!');
    }
};

module.exports = {data, execute};

/*
    fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=jojos-bizarre-adventure&limit=1`)
        .then((res) => res.json())
        .then((json) => message.channel.send(json.results[0].url))
        .catch(e => {
            console.error(e);
            return message.reply('Failed to fetch a gif :slight_frown:');
        })
*/
