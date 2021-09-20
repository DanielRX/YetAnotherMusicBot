// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urban')
        .setDescription('Get definitions from urban dictonary.')
        .addStringOption((option) =>
            option
                .setName('query')
                .setDescription('What do you want to search for?')
                .setRequired(true)),
    /**
     * @param {import('../../').CustomInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        fetch(`https://api.urbandictionary.com/v0/define?term=${
            interaction.options.get('query').value
        }`)
            .then((res) => res.json())
            .then((json) => {
                const embed = new MessageEmbed()
                    .setColor('#BB7D61')
                    .setTitle(`${interaction.options.get('query').value}`)
                    .setAuthor('Urban Dictionary', 'https://i.imgur.com/vdoosDm.png', 'https://urbandictionary.com')
                    .setDescription(`*${json.list[Math.floor(Math.random() * 1)].definition}*`)
                    .setURL(json.list[0].permalink)
                    .setTimestamp()
                    .setFooter('Powered by UrbanDictionary', '');
                return interaction.reply({embeds: [embed]});
            })
            .catch(() => {
                // console.error(err); // no need to spam console for each time it doesn't find a query
                return interaction.reply('Failed to deliver definition :sob:');
            });
    }
};
