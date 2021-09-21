// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {setupOption} = require('../../utils/utils');

const name = 'avatar';
const description = `Responds with a user's avatar`;

const options = [
    {name: 'user', description: 'The user which avatar you want to display', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addUserOption(setupOption(options[0]));

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    const user = interaction.options.get('user').user;
    const embed = new MessageEmbed()
        .setTitle(user.username)
        .setImage(user.displayAvatarURL({dynamic: true}))
        .setColor('#00AE86');

    return interaction.reply({embeds: [embed]});
};

module.exports = {data, execute};
