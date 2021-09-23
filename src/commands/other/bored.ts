// @ts-check
const {fetch} = require('../../utils/utils');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');

export const name = 'bored';
export const description = 'Generate a random activity!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    return fetch('https://www.boredapi.com/api/activity?participants=1')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#6BA3FF')
                .setAuthor('Bored Activites', 'https://i.imgur.com/7Y2F38n.png', 'https://www.boredapi.com/')
                .setDescription(json.activity)
                .setTimestamp()
                .setFooter('Powered by boredapi.com', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err) => {
            console.error(err);
            return interaction.reply('Failed to deliver activity :sob:');
        });
};


