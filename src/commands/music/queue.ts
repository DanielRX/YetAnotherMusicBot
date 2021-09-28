import type {CommandInteraction} from 'discord.js';
import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {PagesBuilder} from 'discord.js-pages';
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

    return new PagesBuilder(interaction as unknown as CommandInteraction)
        .setTitle('Music Queue')
        .setPages(embeds)
        .setListenTimeout(2 * 60 * 1000)
        .setColor('#9096e6')
        .setAuthor(interaction.member.user.username, interaction.member.user.displayAvatarURL())
        .build();
};
