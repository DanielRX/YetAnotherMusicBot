import type {APIMessage} from 'discord-api-types';
import type {CommandInteraction, Message} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {PagesBuilder} from 'discord.js-pages';
import {fetch} from '../../utils/utils';
import type {Nullable} from 'discord-api-types/utils/internals';
import {logger} from '../../utils/logging';

export const name = 'tv-show-search';
export const description = 'Search for TV shows';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'tvshow', description: 'What TV show are you looking for?', required: true, choices: []},
];

type Show = {
    show: Nullable<{
        runtime: string,
        name: string,
        summary: string,
        language: string,
        type: string,
        premiered: string,
        network: {
            country: {
                code: string
            }
            name: string,
        },
        rating: {
            average: string,
        },
        url: string,
        image: {
            original: string
        },
        genres: string[]
    }>
};

const getShowSearch = async(showQuery: string): Promise<Show[]> => {
    const url = `http://api.tvmaze.com/search/shows?q=${encodeURI(showQuery)}`;
    try {
        const body = await fetch<Show[]>(url);
        if(body.status == `429`) {
            throw new Error(':x: Rate Limit exceeded. Please try again in a few minutes.');
        }
        if(body.status == `503`) {
            throw new Error(':x: The service is currently unavailable. Please try again later.');
        }
        if(body.status != '200') {
            throw new Error('There was a problem getting data from the API, make sure you entered a valid TV show name');
        }
        const json = await body.json();
        if(!json.length) {
            throw new Error('There was a problem getting data from the API, make sure you entered a valid TV show name');
        }
        return json;
    } catch(e: unknown) {
        logger.error(e);
        throw new Error('There was a problem getting data from the API, make sure you entered a valid TV show name');
    }
};

const cleanUp = (summary: string) => summary
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

export const execute = async(interaction: CustomInteraction, tvShow: string): Promise<APIMessage | Message | void> => {
    let showResponse: Show[] = [];
    try {
        showResponse = await getShowSearch(`${tvShow}`);
    } catch(e: unknown) {
        return interaction.reply((e as Error).message);
    }

    try {
        const embedArray = [];
        for(let i = 1; i <= showResponse.length; ++i) {
            const showThumbnail = showResponse[i - 1].show.image?.original ?? 'https://static.tvmaze.com/images/no-img/no-img-portrait-text.png';
            const showSummary = cleanUp(showResponse[i - 1].show.summary ?? 'None listed');
            const showLanguage = showResponse[i - 1].show.language ?? 'None listed';

            let showGenre = '';
            const genres = showResponse[i - 1].show.genres;
            if(genres?.length == 0) showGenre = 'None listed';
            if(Array.isArray(genres)) showGenre = genres.join(' ');

            const showType = showResponse[i - 1].show.type ?? 'None listed';
            const showPremiered = showResponse[i - 1].show.premiered ?? 'None listed';

            // Filter Network Row 3
            let showNetwork = '';
            const network = showResponse[i - 1].show.network;
            if(network === null) {
                showNetwork = 'None listed';
            } else {
                showNetwork = `(**${network.country.code}**) ${network.name}`;
            }
            // Filter Runtime Row 3
            let showRuntime = showResponse[i - 1].show.runtime;
            if(showRuntime === null) showRuntime = 'None listed';
            else showRuntime = `${showResponse[i - 1].show.runtime} Minutes`;

            // Filter Ratings Row 4
            const showRatings = showResponse[i - 1].show.rating?.average ?? 'None listed';

            // Build each Tv Shows Embed
            embedArray.push(new MessageEmbed()
                .setTitle((showResponse[i - 1].show.name ?? '').toLocaleString())
                .setURL(showResponse[i - 1].show.url ?? '')
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

        void new PagesBuilder(interaction as unknown as CommandInteraction).setPages(embedArray).setColor('#17a589').build();
    } catch(e: unknown) {
        logger.error(e);
        return interaction.followUp(':x: Something went wrong with your request.');
    }
};

