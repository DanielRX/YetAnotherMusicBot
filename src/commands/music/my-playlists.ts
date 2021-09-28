import type {CustomInteraction} from '../../utils/types';
import member from '../../utils/models/Member';
import {MessageEmbed} from 'discord.js';

export const name = 'my-playlists';
export const description = 'Lists your saved playlists';
export const deferred = true;

export const execute = async(interaction: CustomInteraction): Promise<string | {embeds: MessageEmbed[]}> => {
    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return 'You have zero saved playlists!'; }

    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) { return 'You have zero saved playlists!'; }

    const fields = savedPlaylistsClone.map((playlist, i) => ({name: `${i + 1}`, value: playlist.name, inline: true}));
    const playlistsEmbed = new MessageEmbed().setTitle('Your saved playlists').setFields(fields).setTimestamp();
    return {embeds: [playlistsEmbed]};
};

