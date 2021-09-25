import type {APIMessage} from 'discord-api-types';
import type {Message} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import {PagesBuilder} from 'discord.js-pages';

export const name = 'queue';
export const description = 'Display the music queue';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message | void> => {
    await interaction.deferReply();
    const guildData = interaction.client.guildData.get(interaction.guildId);
    if(guildData && guildData.triviaData.isTriviaRunning) {
        return interaction.followUp(':x: Try again after the trivia has ended!');
    }
    const player = interaction.client.playerManager.get(interaction.guildId);
    if(player && player.queue.length == 0) {
        return interaction.followUp(':x: There are no songs in queue!');
    }
    if(!player) {
        return interaction.followUp(':x: There is nothing playing right now!');
    }

    const queueClone = Array.from(player.queue);
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
