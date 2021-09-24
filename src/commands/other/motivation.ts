import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import fs from 'fs';
import {MessageEmbed} from 'discord.js';

export const name = 'motivation';
export const description = 'Get a random motivational quote!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<void> => {
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

