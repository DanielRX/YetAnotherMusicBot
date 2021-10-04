import type {CustomInteraction} from '../../utils/types';
import member from '../../utils/models/Member';
import {MessageEmbed} from 'discord.js';
import {getAndFillMessage} from '../../utils/messages';

export const name = 'my-playlists';
export const description = 'Lists your saved playlists';
export const deferred = true;

export const execute = async(interaction: CustomInteraction): Promise<string | {embeds: MessageEmbed[]}> => {
    const message = getAndFillMessage('myPlaylists', 'en_gb'); // TODO: User/server locale?

    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return message('NO_SAVED_PLAYLISTS'); }

    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) { return message('NO_SAVED_PLAYLISTS'); }

    const fields = savedPlaylistsClone.map((playlist, i) => ({name: `${i + 1}`, value: playlist.name, inline: true}));
    const playlistsEmbed = new MessageEmbed().setTitle(await message('EMBED_TITLE')).setFields(fields).setTimestamp();
    return {embeds: [playlistsEmbed]};
};

