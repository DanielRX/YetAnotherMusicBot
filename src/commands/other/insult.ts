// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {fetch} = require('../../utils/utils');
const {MessageEmbed} = require('discord.js');

export const name = 'insult';
export const description = 'Generate an evil insult!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const executeexecute = async(interaction) => {
    // thanks to https://evilinsult.com :)
    return fetch('https://evilinsult.com/generate_insult.php?lang=en&type=json')
        .then((res) => res.json())
        .then((json) => {
            const embed = new MessageEmbed()
                .setColor('#E41032')
                .setAuthor('Evil Insult', 'https://i.imgur.com/bOVpNAX.png', 'https://evilinsult.com')
                .setDescription(json.insult)
                .setTimestamp()
                .setFooter('Powered by evilinsult.com', '');
            return interaction.reply({embeds: [embed]});
        })
        .catch((err) => {
            console.error(err);
            return interaction.reply(':x: Failed to deliver insult!');
        });
};


