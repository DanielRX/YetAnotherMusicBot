import type {CommandInput, CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {guildData, playerManager} from '../../utils/client';

export const name = 'queue';
export const description = 'Display the music queue';
export const deferred = true;

const embedColour = '#9096E6';

const pageSize = 24;

export const execute = async({messages, guildId, sender}: CommandInput): Promise<CommandReturn> => {
    const guild = guildData.get(guildId);
    if(guild && guild.triviaData.isTriviaRunning) { return messages.TRIVIA_IS_RUNNING(); }
    const player = playerManager.get(guildId);
    if(player && player.queue.length == 0) { return messages.NO_SONGS(); }
    if(!player) { return messages.NO_SONG_PLAYING(); }

    const queueClone = Array.from(player.queue);
    const embeds = [];

    for(let i = 0; i < Math.ceil(queueClone.length / pageSize); i++) {
        const fields = queueClone
            .slice(i * pageSize, (i + 1) * pageSize)
            .filter((e) => typeof e !== 'undefined')
            .map((e, j) => ({name: `${(j + 1) + (i * pageSize)}`, value: `${e.name}`}));

        embeds.push(new MessageEmbed().setTitle(messages.PAGE_TITLE({i})).setFields(fields));
    }

    const pageData = {title: messages.EMBED_TITLE_MUSIC_QUEUE(), pages: embeds, color: embedColour, author: {username: sender.user.username, avatar: sender.user.displayAvatarURL()}, listenTimeout: 2 * 60 * 1000};
    return {pages: pageData};
};
