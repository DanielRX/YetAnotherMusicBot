import type {CommandInput, CommandReturn} from '../../utils/types';
import member from '../../utils/models/Member';
import {MessageEmbed} from 'discord.js';

export const name = 'display-playlist';
export const description = 'Display a saved playlist';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'What is the name of the playlist you would like to display?', required: true, choices: []}
];

const maxLength = 24;

export const execute = async({sender, messages, params: {playlistName}}: CommandInput<{playlistName: string}>): Promise<CommandReturn> => {
    // Check if user has playlists or if user is saved in the DB
    const userData = await member.findOne({memberId: sender.id}).exec();
    if(!userData) { return messages.NO_SAVED_PLAYLISTS(); }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length === 0) { return messages.NO_SAVED_PLAYLISTS(); }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) { return messages.PLAYLIST_NOT_FOUND({playlistName}); }

    const urlsArrayClone = savedPlaylistsClone[location].urls;
    if(urlsArrayClone.length === 0) { return messages.EMPTY_PLAYLIST({playlistName}); }

    const savedPlaylistEmbed = new MessageEmbed().setColor('#FF7373').setTitle(playlistName).setTimestamp();
    const fields = urlsArrayClone.slice(0, maxLength).map((x, i) => ({name: `${i + 1}`, value: `${x.name}`}));
    savedPlaylistEmbed.setFields(fields);

    return {embeds: [savedPlaylistEmbed]};
};

