import type {APIMessage} from 'discord-api-types';
import type {Message} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import {PagesBuilder} from 'discord.js-pages';

export const name = 'queue-history';
export const description = 'Display the music queue history';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message | void> => {
    const guildData = interaction.client.guildData.get(interaction.guildId);
    if(!guildData) {
        return interaction.followUp('There is no music queue history!');
    }
    if(!guildData.queueHistory.length) {
        return interaction.followUp('There is no music queue history!');
    }

    const queueClone = Array.from(guildData.queueHistory);
    const embeds = [];

    for(let i = 0; i < Math.ceil(queueClone.length / 24); i++) {
        const fields = queueClone
            .slice(i * 24, 24 + i * 24)
            .filter((e) => e)
            .map((e, j) => ({name: `${j + 1 + i * 24}`, value: `${e.title}`}));

        embeds.push(new MessageEmbed().setTitle(`Page ${i}`).setFields(fields));
    }

    return new PagesBuilder(interaction)
        .setTitle('Music Queue')
        .setPages(embeds)
        .setListenTimeout(2 * 60 * 1000)
        .setColor('#9096e6')
        .setAuthor(interaction.member.user.username, interaction.member.user.displayAvatarURL())
        .build();
};
