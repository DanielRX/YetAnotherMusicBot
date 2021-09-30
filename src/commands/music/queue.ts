import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {guildData, playerManager} from '../../utils/client';

export const name = 'queue';
export const description = 'Display the music queue';
export const deferred = true;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    const guild = guildData.get(interaction.guildId);
    if(guild && guild.triviaData.isTriviaRunning) { return ':x: Try again after the trivia has ended!'; }
    const player = playerManager.get(interaction.guildId);
    if(player && player.queue.length == 0) { return ':x: There are no songs in queue!'; }
    if(!player) { return ':x: There is nothing playing right now!'; }

    const queueClone = Array.from(player.queue);
    const embeds = [];

    for(let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
        const fields = queueClone
            .slice(i * 24, 24 + i * 24)
            .filter((e) => typeof e !== 'undefined')
            .map((e, j) => ({name: `${j + 1 + i * 24}`, value: `${e.name}`}));

        embeds.push(new MessageEmbed().setTitle(`Page ${i}`).setFields(fields));
    }

    const pageData = {title: 'Music Queue', pages: embeds, color: '#9096E6' as const, author: {username: interaction.member.user.username, avatar: interaction.member.user.displayAvatarURL()}, listenTimeout: 2 * 60 * 1000};
    return {pages: pageData};
};
