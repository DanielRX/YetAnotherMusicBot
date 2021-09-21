//@ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const fetch = require('node-fetch');
const {PagesBuilder} = require('discord.js-pages');
const {rawgAPI} = require('../../config.json');
const {setupOption} = require('../../utils/utils');

const name = 'game-search';
const description = 'Search for game information';

const options = [
    {name: 'game', description: 'What game are you looking for?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

const getGameDetails = async(query) => {
    return new Promise(async function(resolve, reject) {
        const url = `https://api.rawg.io/api/games/${query}?key=${rawgAPI}`;
        try {
            const body = await fetch(url);
            if(body.status == `429`) {
                reject(':x: Rate Limit exceeded. Please try again in a few minutes.');
            }
            if(body.status == `503`) {
                reject(':x: The service is currently unavailable. Please try again later.');
            }
            if(body.status == '404') {
                reject(`:x: Error: ${query} was not found`);
            }
            if(body.status !== 200) {
                reject(':x: There was a problem getting data from the API, make sure you entered a valid game tittle');
            }

            let data = await body.json();
            if(data.redirect) {
                const redirect = await fetch(`https://api.rawg.io/api/games/${body.slug}?key=${rawgAPI}`);
                data = await redirect.json();
            }
            // 'id' is the only value that must be present to all valid queries
            if(!data.id) {
                reject(':x: There was a problem getting data from the API, make sure you entered a valid game title');
            }
            resolve(data);
        } catch(e) {
            console.error(e);
            reject('There was a problem getting data from the API, make sure you entered a valid game title');
        }
    });
};

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    if(!rawgAPI) { return interaction.reply('This command is not enabled on this bot!'); }
    const gameTitleFiltered = interaction.options
        .get('game')
        .value.replace(/ /g, '-')
        .replace(/'/g, '')
        .toLowerCase();

    // using this link it provides all the info, instead of using search
    try {
        var response = await getGameDetails(gameTitleFiltered);
    } catch(error) {
        return void interaction.reply(error);
    }

    const releaseDate = (response.tba) ? 'TBA' : response.released || 'None Listed.';
    const esrbRating = (response.esrb_rating == null) ? 'None Listed.' : response.esrb_rating.name;
    const userRating = (response.rating == null) ? 'None Listed.' : response.rating + '/5';

    const embedArray = [
        // Page 1
        new MessageEmbed()
            .setDescription('**Game Description**\n' + response.description_raw.slice(0, 2000) + '...')
            .addField('Released', releaseDate, true)
            .addField('ESRB Rating', esrbRating, true)
            .addField('Score', userRating, true)
    ];

    const developerArray = (response.developers.length > 0) ? response.developers.map((e) => e.name) : ['None Listed.'];
    const publisherArray = (response.publishers.length > 0) ? response.publishers.map((e) => e.name) : ['None Listed.'];
    const platformArray = (response.platforms.length > 0) ? response.platforms.map((e) => e.platform.name) : ['None Listed.'];
    const genreArray = (response.genres.length > 0) ? response.genres.map((e) => e.name) : ['None Listed.'];
    const retailerArray = (response.stores.length > 0) ? response.stores.map((e) => `[${e.store.name}](${e.url})`) : ['None Listed.'];

    embedArray.push(
        // Page 2
        new MessageEmbed()
            // Row 1
            .addField('Developer(s)', developerArray.toString().replace(/,/g, ', '), true) // TODO: Use join
            .addField('Publisher(s)', publisherArray.toString().replace(/,/g, ', '), true) // TODO: Use join
            .addField('Platform(s)', platformArray.toString().replace(/,/g, ', '), true) // TODO: Use join
            // Row 2
            .addField('Genre(s)', genreArray.toString().replace(/,/g, ', '), true) // TODO: Use join
            .addField('Retailer(s)', retailerArray.toString() .replace(/,/g, ', ').replace(/`/g, ''))); // TODO: Use join

    const embed = new PagesBuilder(interaction)
        .setPages(embedArray)
        .setTitle(response.name)
        .setColor(`#b5b5b5`);
    if(response.background_image) {
        embed.setThumbnail(response.background_image);
    }
    void embed.build();
};

module.exports = {data, execute};
