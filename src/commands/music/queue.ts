import type {CommandInput, CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {guildData, playerManager} from '../../utils/client';

export const name = 'queue';
export const description = 'Display the music queue';
export const deferred = true;

export const execute = async({interaction, messages, guildId}: CommandInput): Promise<CommandReturn> => {
    const guild = guildData.get(guildId);
    if(guild && guild.triviaData.isTriviaRunning) { return messages.TRIVIA_IS_RUNNING(); }
    const player = playerManager.get(guildId);
    if(player && player.queue.length == 0) { return messages.NO_SONGS(); }
    if(!player) { return messages.NO_SONG_PLAYING(); }

    const queueClone = Array.from(player.queue);
    const embeds = [];

    for(let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
        const fields = queueClone
            .slice(i * 24, (i + 1) * 24)
            .filter((e) => typeof e !== 'undefined')
            .map((e, j) => ({name: `${j + 1 + i * 24}`, value: `${e.name}`}));

        embeds.push(new MessageEmbed().setTitle(messages.PAGE_TITLE({i})).setFields(fields));
    }

    const pageData = {title: messages.EMBED_TITLE_MUSIC_QUEUE(), pages: embeds, color: '#9096E6' as const, author: {username: interaction.member.user.username, avatar: interaction.member.user.displayAvatarURL()}, listenTimeout: 2 * 60 * 1000};
    return {pages: pageData};
};
