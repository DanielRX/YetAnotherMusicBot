// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {fetch} = require('../../utils/utils');
const {PagesBuilder} = require('discord.js-pages');
const {newsAPI} = require('../../utils/config');

export const name = 'world-news';
export const description = 'Replies with the 10 latest world news headlines!';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

/**
 * @param {import('../..').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
export const executeexecute = async(interaction) => {
    if(!newsAPI) { return interaction.reply(':x: This command is not enabled'); }
    // powered by NewsAPI.org
    try {
        const response = await fetch(`https://newsapi.org/v2/top-headlines?sources=reuters&pageSize=10&apiKey=${newsAPI}`);
        const json = await response.json();
        const articleArr = [];

        for(let i = 1; i <= json.articles.length; ++i) {
            articleArr.push(new MessageEmbed()
                .setColor('#FF4F00')
                .setTitle(json.articles[i - 1].title)
                .setURL(json.articles[i - 1].url)
                .setAuthor(json.articles[i - 1].author)
                .setDescription(json.articles[i - 1].description)
                .setThumbnail(json.articles[i - 1].urlToImage)
                .setTimestamp(json.articles[i - 1].publishedAt)
                .setFooter('powered by NewsAPI.org'));
        }

        return new PagesBuilder(interaction).setPages(articleArr).build();
    } catch(e) {
        await interaction.reply(':x: Something failed along the way!');
        return console.error(e);
    }
};


