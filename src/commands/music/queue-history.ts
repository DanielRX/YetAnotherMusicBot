import type {CommandInteraction} from 'discord.js';
import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {PagesBuilder} from 'discord.js-pages';
import {guildData} from '../../utils/client';

export const name = 'queue-history';
export const description = 'Display the music queue history';
export const deferred = false;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    const guild = guildData.get(interaction.guildId);
    if(!guild) { return 'There is no music queue history!'; }
    if(!guild.queueHistory.length) { return 'There is no music queue history!'; }

    const queueClone = Array.from(guild.queueHistory);
    const embeds = [];

    for(let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
        const fields = queueClone
            .slice(i * 24, 24 + i * 24)
            .filter((e) => typeof e !== 'undefined')
            .map((e, j) => ({name: `${j + 1 + i * 24}`, value: `${e.name}`}));

        embeds.push(new MessageEmbed().setTitle(`Page ${i}`).setFields(fields));
    }

    await new PagesBuilder(interaction as unknown as CommandInteraction)
        .setTitle('Music Queue')
        .setPages(embeds)
        .setListenTimeout(2 * 60 * 1000)
        .setColor('#9096e6')
        .setAuthor(interaction.member.user.username, interaction.member.user.displayAvatarURL())
        .build();
};
