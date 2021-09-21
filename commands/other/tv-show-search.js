// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');
const {PagesBuilder} = require('discord.js-pages');
const {setupOption} = require('../../utils/utils');

const name = 'tv-show-search';
const description = 'Search for TV shows';

const options = [
    {name: 'tvshow', description: 'What TV show are you looking for?', required: true, choices: []},
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

const getShowSearch = async(showQuery) => {
    return new Promise(async function(resolve, reject) {
        const url = `http://api.tvmaze.com/search/shows?q=${encodeURI(showQuery)}`;
        try {
            const body = await fetch(url);
            if(body.status == `429`) {
                reject(':x: Rate Limit exceeded. Please try again in a few minutes.');
            }
            if(body.status == `503`) {
                reject(':x: The service is currently unavailable. Please try again later.');
            }
            if(body.status !== 200) {
                reject('There was a problem getting data from the API, make sure you entered a valid TV show name');
            }
            const json = await body.json();
            if(!json.length) {
                reject('There was a problem getting data from the API, make sure you entered a valid TV show name');
            }
            resolve(json);
        } catch(e) {
            console.error(e);
            reject('There was a problem getting data from the API, make sure you entered a valid TV show name');
        }
    });
};

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<import('discord.js').Message | import('discord-api-types').APIMessage>}
 */
const execute = async(interaction) => {
    const tvshow = interaction.options.get('tvshow').value;
    let showResponse;
    try {
        showResponse = await getShowSearch(tvshow);
    } catch(e) {
        return interaction.reply(e);
    }

    try {
        const embedArray = [];
        for(let i = 1; i <= showResponse.length; ++i) {
            // Filter Thumbnail URL
            let showThumbnail = showResponse[i - 1].show.image;
            if(showThumbnail == null) {
                showThumbnail = 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
            } else {
                showThumbnail = showResponse[i - 1].show.image.original;
            }

            // Filter Summary Row 1
            let showSummary = showResponse[i - 1].show.summary;
            if(showSummary == null) {
                showSummary = 'None listed';
            } else {
                showSummary = showResponse[i - 1].show.summary
                    .replace(/<(\/)?b>/g, '**')
                    .replace(/<(\/)?i>/g, '*')
                    .replace(/<(\/)?p>/g, '')
                    .replace(/<br>/g, '\n')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&apos;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&#39;/g, "'")
                    .toLocaleString();
            }

            // Filter Language Row 2
            let showLanguage = showResponse[i - 1].show.language || 'None listed';

            // Filter Genere Row 2
            let showGenre = showResponse[i - 1].show.genres;
            if(showGenre.length == 0) showGenre = 'None listed';
            if(typeof showGenre === 'object') showGenre = showGenre.join(' ');

            // Filter Types Row 2
            let showType = showResponse[i - 1].show.type || 'None listed';

            // Filter Premiered Row 3
            const showPremiered = showResponse[i - 1].show.premiered || 'None listed';

            // Filter Network Row 3
            let showNetwork = showResponse[i - 1].show.network;
            if(showNetwork === null) showNetwork = 'None listed';
            else
                showNetwork = `(**${showResponse[i - 1].show.network.country.code}**) ${showResponse[i - 1].show.network.name}`;

            // Filter Runtime Row 3
            let showRuntime = showResponse[i - 1].show.runtime;
            if(showRuntime === null) showRuntime = 'None listed';
            else showRuntime = showResponse[i - 1].show.runtime + ' Minutes';

            // Filter Ratings Row 4
            let showRatings = showResponse[i - 1].show.rating.average || 'None listed';

            // Build each Tv Shows Embed
            embedArray.push(new MessageEmbed()
                .setTitle(showResponse[i - 1].show.name.toLocaleString())
                .setURL(showResponse[i - 1].show.url)
                .setThumbnail(showThumbnail)
                // Row 1
                .setDescription('**Summary**\n' + showSummary)
                // Row 2
                .addField('Language', showLanguage, true)
                .addField('Genre(s)', showGenre, true)
                .addField('Show Type', showType, true)
                // Row 3
                .addField('Premiered', showPremiered, true)
                .addField('Network', showNetwork, true)
                .addField('Runtime', showRuntime, true)
                // Row 4
                .addField('Average Rating', showRatings.toString())
                .setFooter(`(Page ${i}/${showResponse.length}) ` + 'Powered by tvmaze.com', 'https://static.tvmaze.com/images/favico/favicon-32x32.png'));
        }

        void new PagesBuilder(interaction).setPages(embedArray).setColor('#17a589').build();
    } catch(error) {
        console.log(error);
        return interaction.followUp(':x: Something went wrong with your request.');
    }
};

module.exports = {data, execute};
