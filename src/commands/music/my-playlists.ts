import type {APIMessage} from 'discord-api-types';
import type {Message} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import Member from '../../utils/models/Member';
import {MessageEmbed} from 'discord.js';

export const name = 'my-playlists';
export const description = 'Lists your saved playlists';

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message> => {
    void interaction.deferReply();

    const userData = await Member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) {
        return interaction.followUp('You have zero saved playlists!');
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) {
        return interaction.followUp('You have zero saved playlists!');
    }
    const fields = savedPlaylistsClone.map((playlist, i) => ({name: `${i + 1}`, value: playlist.name, inline: true}));
    const playlistsEmbed = new MessageEmbed()
        .setTitle('Your saved playlists')
        .setFields(fields)
        .setTimestamp();

    return interaction.followUp({embeds: [playlistsEmbed]});
};

