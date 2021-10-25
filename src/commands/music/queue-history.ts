import type {CommandReturn, CommandInput} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {guildData} from '../../utils/client';

export const name = 'queue-history';
export const description = 'Display the music queue history';
export const deferred = false;

export const execute = async({interaction, messages}: CommandInput): Promise<CommandReturn> => {
    const guild = guildData.get(interaction.guildId);
    if(!guild) { return messages.NO_HISTORY(); }
    if(!guild.queueHistory.length) { return messages.NO_HISTORY(); }

    const queueClone = Array.from(guild.queueHistory);
    const embeds = [];

    for(let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
        const fields = queueClone
            .slice(i * 24, (i + 1) * 24)
            .filter((e) => typeof e !== 'undefined')
            .map((e, j) => ({name: `${j + 1 + i * 24}`, value: `${e.name}`}));

        embeds.push(new MessageEmbed().setTitle(messages.PAGE_TITLE({i})).setFields(fields));
    }

    const pageData = {title: messages.EMBED_TITLE_MUSIC_QUEUE_HISTORY(), pages: embeds, color: '#9096E6' as const, author: {username: interaction.member.user.username, avatar: interaction.member.user.displayAvatarURL()}, listenTimeout: 2 * 60 * 1000};
    return {pages: pageData};
};
