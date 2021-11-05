import type {CommandInput} from '../../utils/types';
import member from '../../utils/models/Member';
import {MessageEmbed} from 'discord.js';

export const name = 'my-playlists';
export const description = 'Lists your saved playlists';
export const deferred = true;

export const execute = async({sender, messages}: CommandInput): Promise<string | {embeds: MessageEmbed[]}> => {
    const userData = await member.findOne({memberId: sender.id}).exec();
    if(!userData) { return messages.NO_SAVED_PLAYLISTS(); }

    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) { return messages.NO_SAVED_PLAYLISTS(); }

    const fields = savedPlaylistsClone.map((playlist, i) => ({name: `${i + 1}`, value: playlist.name, inline: true}));
    const playlistsEmbed = new MessageEmbed().setTitle(messages.EMBED_TITLE_PLAYLISTS()).setFields(fields).setTimestamp();
    return {embeds: [playlistsEmbed]};
};

