// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fetch} = require('../../utils/utils');
const {MessageEmbed} = require('discord.js');

const name = 'fortune';
const description = 'Replies with a fortune cookie tip!';

const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    try {
        const json = await fetch('http://yerkee.com/api/fortune').then((res) => res.json());
        const embed = new MessageEmbed()
            .setColor('#F4D190')
            .setAuthor('Fortune Cookie', 'https://i.imgur.com/58wIjK0.png', 'https://yerkee.com')
            .setDescription(json.fortune)
            .setTimestamp()
            .setFooter('Powered by yerkee.com', '');
        return interaction.reply({embeds: [embed]});
    } catch(e) {
        console.error(e);
        return interaction.reply(':x: Could not obtain a fortune cookie!');
    }
};

module.exports = {data, execute, name, description};
