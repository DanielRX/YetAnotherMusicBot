// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fs = require('fs');

const name = 'jojo';
const description = 'Replies with a random jojo gif!';

module.exports = {
    data: new SlashCommandBuilder().setName(name).setDescription(description),
    /**
     * @param {import('discord.js').CommandInteraction} interaction
     * @returns {Promise<void>}
     */
    execute(interaction) {
        try {
            const linkArray = fs.readFileSync('././resources/gifs/jojolinks.txt', 'utf8').split('\n');
            const link = linkArray[Math.floor(Math.random() * linkArray.length)];
            return interaction.reply(link);
        } catch(e) {
            console.error(e);
            return interaction.reply(':x: Failed to fetch a gif!');
        }
    }
};


/*
    fetch(`https://g.tenor.com/v1/random?key=${tenorAPI}&q=jojos-bizarre-adventure&limit=1`)
        .then((res) => res.json())
        .then((json) => message.channel.send(json.results[0].url))
        .catch(e => {
            console.error(e);
            return message.reply('Failed to fetch a gif :slight_frown:');
        })
*/
