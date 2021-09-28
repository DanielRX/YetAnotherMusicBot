import type {CommandReturn, CustomInteraction} from '../../utils/types';
import type {CommandInteraction} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import {fetch} from '../../utils/utils';
import {PagesBuilder} from 'discord.js-pages';
import {config} from '../../utils/config';
import {logger} from '../../utils/logging';

export const name = 'world-news';
export const description = 'Replies with the 10 latest world news headlines!';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    if(!config.newsAPI) { return ':x: This command is not enabled'; }
    // powered by NewsAPI.org
    try {
        const response = await fetch<{articles: ({title: string, url: string, author: string, description: string, urlToImage: string, publishedAt: number})[]}>(`https://newsapi.org/v2/top-headlines?sources=reuters&pageSize=10&apiKey=${config.newsAPI}`);
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

        return new PagesBuilder(interaction as unknown as CommandInteraction).setPages(articleArr).build();
    } catch(e: unknown) {
        logger.error(e);
        return ':x: Something failed along the way!';
    }
};
