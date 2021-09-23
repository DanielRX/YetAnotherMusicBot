// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fetch} = require('../../utils/utils');
const {MessageEmbed} = require('discord.js');

export const name = 'trump';
export const description = 'Get a random quote from Donald Trump!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    return fetch('https://api.tronalddump.io/random/quote')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#BB7D61')
                .setAuthor('Donald Trump', 'https://www.whitehouse.gov/wp-content/uploads/2021/01/45_donald_trump.jpg')
                .setDescription(json.value)
                .setTimestamp(json.appeared_at)
                .setFooter('Powered by tronalddump.io! Quote was posted', ' ');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err) => {
            console.error(err);
            return interaction.reply('Failed to deliver quote :sob:');
        });
};


