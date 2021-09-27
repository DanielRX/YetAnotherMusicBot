import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import type {CommandInteraction, Message} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import {PagesBuilder} from 'discord.js-pages';
import {config} from '../../utils/config';
import {setupOption, fetch} from '../../utils/utils';
import type {APIMessage} from 'discord-api-types';

export const name = 'game-search';
export const description = 'Search for game information';

export const options = [
    {name: 'game', description: 'What game are you looking for?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

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
    try {
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
    } catch(e: unknown) {
        console.error(e);
        throw new Error('There was a problem getting data from the API, make sure you entered a valid game title');
    }
};

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message | void> => {
    if(!config.rawgAPI) { return interaction.reply('This command is not enabled on this bot!'); }
    const gameTitleFiltered = `${interaction.options.get('game')?.value}`.replace(/ /g, '-').replace(/'/g, '').toLowerCase();

    // using this link it provides all the info, instead of using search
    return getGameDetails(gameTitleFiltered)
        .then(async(response) => {
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

            const embed = new PagesBuilder(interaction as unknown as CommandInteraction)
                .setPages([page1, page2])
                .setTitle(response.name)
                .setColor(`#b5b5b5`);
            if(response.background_image) {
                embed.setThumbnail(response.background_image);
            }
            return embed.build();
        })
        .catch(async(e: unknown) => interaction.reply(e as any));
};

