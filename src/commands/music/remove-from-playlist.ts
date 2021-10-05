import type {CommandReturn, CustomInteraction, MessageFunction} from '../../utils/types';
import member from '../../utils/models/Member';

export const name = 'remove-from-playlist';
export const description = 'Remove a song from a saved playlist';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'playlist', description: 'What is the playlist you would like to delete a song from?', required: true, choices: []},
    {type: 'integer' as const, name: 'index', description: 'What is the index of the video you would like to delete from your saved playlist?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, message: MessageFunction, playlistName: string, index: number): Promise<CommandReturn> => {
    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return message('NO_SAVED_PLAYLISTS'); }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length == 0) { return message('NO_SAVED_PLAYLISTS'); }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) { return message('PLAYLIST_NOT_FOUND', {playlistName}); }
    const urlsArrayClone = savedPlaylistsClone[location].urls;
    if(urlsArrayClone.length == 0) { return message('EMPTY_PLAYLIST', {playlistName}); }
    if(index > urlsArrayClone.length) { return message('INDEX_TOO_HIGH'); }
    const title = urlsArrayClone[index - 1].name;
    urlsArrayClone.splice(index - 1, 1);
    savedPlaylistsClone[location].urls = urlsArrayClone;
    await member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone}).exec();
    return message('REMOVED', {title, name: savedPlaylistsClone[location].name});
};
