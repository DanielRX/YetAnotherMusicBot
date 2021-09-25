import {setupOption, fetch} from '../../utils/utils';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed, MessageActionRow, MessageSelectMenu} from 'discord.js';
import {PagesBuilder} from 'discord.js-pages';
import {readJSONSync} from 'fs-extra';
import type {CustomInteraction} from '../../utils/types';
const {MaxResponseTime} = readJSONSync('../../../options.json');

export const name = 'reddit';
export const description = 'Replies with 10 top daily posts in wanted subreddit, you can specify sorting and time!';

export const options = [
    {name: 'subreddit', description: 'What subreddit would you like to search?', required: true, choices: []},
    {name: 'sort', description: 'What posts do you want to see? Select from best/hot/top/new/controversial/rising', required: true, choices: ['best', 'hot', 'new', 'top', 'controversial', 'rising']},
];

const fetchFromReddit = async(interaction: CustomInteraction, subreddit: string, sort: string, timeFilter = 'day') => {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/${sort}/.json?limit=10&t=${timeFilter}`);
    const json = await response.json();
    const dataArr = [];

    for(let i = 1; i <= json.data.children.length; ++i) {
        let color: '#CF000F' | '#FE9004' = '#FE9004';
        const redditPost = json.data.children[i - 1];

        if(redditPost.data.title.length > 255)
            redditPost.data.title = redditPost.data.title.substring(0, 252) + '...'; // discord.js does not allow embed title lengths greater than 256

        if(redditPost.data.over_18) color = '#CF000F';

        dataArr.push(new MessageEmbed()
            .setColor(color) // if post is nsfw, color is red
            .setTitle(redditPost.data.title)
            .setURL(`https://www.reddit.com${redditPost.data.permalink}`)
            .setDescription(`Upvotes: ${redditPost.data.score} :thumbsup: `)
            .setAuthor(redditPost.data.author));
    }

    void new PagesBuilder(interaction).setPages(dataArr).build();
};

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addStringOption(setupOption(options[1]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const message = await interaction.deferReply({fetchReply: true});
    const subreddit = interaction.options.get('subreddit')?.value as string;
    const sort = interaction.options.get('sort')?.value as string;

    if(sort === 'top' || sort === 'controversial') {
        const row = new MessageActionRow().addComponents(new MessageSelectMenu()
            .setCustomId('top_or_controversial')
            .setPlaceholder('Please select an option')
            .addOptions([
                {label: 'hour', value: 'hour'},
                {label: 'week', value: 'week'},
                {label: 'month', value: 'month'},
                {label: 'year', value: 'year'},
                {label: 'all', value: 'all'}
            ]));
        const menu = await message.channel.send({
            content: `:loud_sound: Do you want to get the ${sort} posts from past hour/week/month/year or all?`,
            components: [row]
        });

        const collector = menu.createMessageComponentCollector({
            componentType: 'SELECT_MENU',
            time: MaxResponseTime * 1000
        });

        collector.on('end', () => {
            if(menu) menu.delete().catch(console.error); //! Alt: menu?.delete().catch(console.error);
        });

        collector.on('collect', async(i) => {
            if(i.user.id !== interaction.user.id) {
                return i.reply({content: `This element is not for you!`, ephemeral: true});
            }
            collector.stop();
            const timeFilter = i.values[0];
            return fetchFromReddit(interaction, subreddit, sort, timeFilter);
        });
    } else {
        return fetchFromReddit(interaction, subreddit, sort);
    }
};
