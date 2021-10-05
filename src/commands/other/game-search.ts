/* eslint-disable @typescript-eslint/naming-convention */
import type {CommandReturn, CustomInteraction, MessageFunction} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {config} from '../../utils/config';
import {fetch} from '../../utils/utils';

export const name = 'game-search';
export const description = 'Search for game information';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'game', description: 'What game are you looking for?', required: true, choices: []}
];

type GameData = {
    background_image: string,
    name: string,
    developers: ({name: string})[],
    publishers: ({name: string})[],
    genres: ({name: string})[],
    redirect: boolean,
    id: string,
    tba: string,
    released: string,
    esrb_rating: {name: string} | null,
    description_raw: string,
    rating: string | null,
    platforms: ({platform: {name: string}})[],
    stores: ({store: {name: string}, url: string})[]
};

const getGameDetails = async(query: string) => {
    const url = `https://api.rawg.io/api/games/${query}?key=${config.rawgAPI}`;
    const body = await fetch<GameData>(url);
    if(body.status == `429`) {
        throw new Error(':x: Rate Limit exceeded. Please try again in a few minutes.');
    }
    if(body.status == `503`) {
        throw new Error(':x: The service is currently unavailable. Please try again later.');
    }
    if(body.status == '404') {
        throw new Error(`:x: Error: ${query} was not found`);
    }
    if(body.status !== '200') {
        throw new Error(':x: There was a problem getting data from the API, make sure you entered a valid game tittle');
    }

    let json = await body.json();
    if(json.redirect) {
        const redirect = await fetch<GameData>(`https://api.rawg.io/api/games/${body.slug}?key=${config.rawgAPI}`);
        json = await redirect.json();
    }
    // 'id' is the only value that must be present to all valid queries
    if(!json.id) {
        throw new Error(':x: There was a problem getting data from the API, make sure you entered a valid game title');
    }
    return json;
};

export const execute = async(_: CustomInteraction, message: MessageFunction, game: string): Promise<CommandReturn> => {
    if(!config.rawgAPI) { return 'This command is not enabled on this bot!'; }
    const gameTitleFiltered = game.replace(/ /g, '-').replace(/'/g, '').toLowerCase();

    // using this link it provides all the info, instead of using search
    const response = await getGameDetails(gameTitleFiltered);
    const releaseDate = (response.tba) ? 'TBA' : response.released || 'None Listed.';
    const esrbRating = (response.esrb_rating == null) ? 'None Listed.' : response.esrb_rating.name;
    const userRating = (response.rating == null) ? 'None Listed.' : response.rating + '/5';

    const page1 = new MessageEmbed()
        .setDescription('**Game Description**\n' + response.description_raw.slice(0, 2000) + '...')
        .addField('Released', releaseDate, true)
        .addField('ESRB Rating', esrbRating, true)
        .addField('Score', userRating, true);

    const developerArray = (response.developers.length > 0) ? response.developers.map((e) => e.name) : ['None Listed.'];
    const publisherArray = (response.publishers.length > 0) ? response.publishers.map((e) => e.name) : ['None Listed.'];
    const genreArray = (response.genres.length > 0) ? response.genres.map((e) => e.name) : ['None Listed.'];
    const platformArray = (response.platforms.length > 0) ? response.platforms.map((e) => e.platform.name) : ['None Listed.'];
    const retailerArray = (response.stores.length > 0) ? response.stores.map((e) => `[${e.store.name}](${e.url})`) : ['None Listed.'];

    const page2 = new MessageEmbed()
    // Row 1
        .addField('Developer(s)', developerArray.join(', '), true)
        .addField('Publisher(s)', publisherArray.join(', '), true)
        .addField('Platform(s)', platformArray.join(', '), true)
    // Row 2
        .addField('Genre(s)', genreArray.join(', '), true)
        .addField('Retailer(s)', retailerArray.join(', ').replace(/`/g, ''));
    const pageData = {title: response.name, pages: [page1, page2], color: '#B5B5B5' as const, thumbnail: response.background_image};

    return {pages: pageData};
};

