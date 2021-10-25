import type {CommandInput, CommandReturn} from '../../utils/types';
import member from '../../utils/models/Member';

export const name = 'delete-playlist';
export const description = 'Delete a playlist from your saved playlists';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'Which playlist would you like to delete?', required: true, choices: []}
];

export const execute = async({interaction, messages, params: {playlistName}}: CommandInput<{playlistName: string}>): Promise<CommandReturn> => {
    // Check if user has playlists or if user is saved in the DB
    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return messages.NO_SAVED_PLAYLISTS(); }

    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length === 0) { return messages.NO_SAVED_PLAYLISTS(); }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) { return messages.PLAYLIST_NOT_FOUND({playlistName}); }

    savedPlaylistsClone.splice(location, 1);
    await member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone});
    return messages.PLAYLIST_REMOVED({playlistName});
};
