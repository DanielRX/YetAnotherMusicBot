import {MessageSelectMenu, MessageActionRow} from 'discord.js';

export const createSelectMenu = (namesArray: string[]): MessageActionRow =>
    new MessageActionRow().addComponents(new MessageSelectMenu()
        .setCustomId('search-yt-menu')
        .setPlaceholder('Please select a video')
        .addOptions([
            {label: `${namesArray[0]}`, value: '1'},
            {label: `${namesArray[1]}`, value: '2'},
            {label: `${namesArray[2]}`, value: '3'},
            {label: `${namesArray[3]}`, value: '4'},
            {label: `${namesArray[4]}`, value: '5'},
            {label: 'Cancel', value: 'cancel_option'}
        ]));

export const createHistoryRow = (query: string): MessageActionRow => new MessageActionRow()
    .addComponents(new MessageSelectMenu()
        .setCustomId('history-select')
        .setPlaceholder('Please select an option')
        .addOptions([
            {label: 'History Queue', description: `Play song number ${query}`, value: 'history_option', emoji: '🔙'},
            {label: 'YouTube', description: `Search '${query}' on YouTube`, value: 'youtube_option', emoji: '🔍'},
            {label: 'Cancel', value: 'cancel_option', emoji: '❌'}
        ]));

