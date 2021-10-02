import type {CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {fetch} from '../../utils/utils';
import {config} from '../../utils/config';

export const name = 'world-news';
export const description = 'Replies with the 10 latest world news headlines!';
export const deferred = false;

export const execute = async(): Promise<CommandReturn> => {
    if(!config.newsAPI) { return ':x: This command is not enabled'; }
    // powered by NewsAPI.org
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
    const pageData = {pages: articleArr};
    return {pages: pageData};
};
