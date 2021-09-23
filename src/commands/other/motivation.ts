// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const fs = require('fs');
const {MessageEmbed} = require('discord.js');

export const namest name = 'motivation';
export const description = 'Get a random motivational quote!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const execute = async(interaction) => {
    // thanks to https://type.fit/api/quotes

    const jsonQuotes = fs.readFileSync('././resources/quotes/motivational.json', 'utf8');
    const quoteArray = JSON.parse(jsonQuotes).quotes;

    const randomQuote = quoteArray[Math.floor(Math.random() * quoteArray.length)];

    const quoteEmbed = new MessageEmbed()
        .setAuthor('Motivational Quote', 'https://i.imgur.com/Cnr6cQb.png', 'https://type.fit')
        .setDescription(`*"${randomQuote.text}*"\n\n-${randomQuote.author}`)
        .setTimestamp()
        .setFooter('Powered by type.fit')
        .setColor('#FFD77A');
    return interaction.reply({embeds: [quoteEmbed]});
};


