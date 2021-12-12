import type {CommandInput, CommandReturn, WorldNewsData} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {fetchJSON} from '../../utils/utils';
import {config} from '../../utils/config';

export const name = 'world-news';
export const description = 'Replies with the 10 latest world news headlines!';
export const deferred = false;

const embedColour = '#FF4F00';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    if(!config.newsAPI) { return ':x: This command is not enabled'; }
    // powered by NewsAPI.org
    const json = await fetchJSON<WorldNewsData>(`https://newsapi.org/v2/top-headlines?sources=reuters&pageSize=10&apiKey=${config.newsAPI}`);
    const articleArr = [];

    for(const article of json.articles) {
        articleArr.push(new MessageEmbed({color: embedColour})
            .setTitle(article.title)
            .setURL(article.url)
            .setAuthor(article.author)
            .setDescription(article.description)
            .setThumbnail(article.urlToImage)
            .setTimestamp(article.publishedAt)
            .setFooter(`${messages.POWERED_BY()} NewsAPI.org`));
    }
    const pageData = {pages: articleArr};
    return {pages: pageData};
};
