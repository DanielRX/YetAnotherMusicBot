import type {CommandReturn, CustomInteraction} from '../../utils/types';
import member from '../../utils/models/Member';
import {logger} from '../../utils/logging';
import {getAndFillMessage} from '../../utils/messages';

export const name = 'create-playlist';
export const description = 'Create a custom playlist that you can play anytime';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'What is the name of the playlist you would like to create?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, playlistName: string): Promise<CommandReturn> => {
    const message = getAndFillMessage('createPlaylist', 'en_gb'); // TODO: User/server locale?
    const {member: {id, user: {username}, joinedAt}} = interaction;
    // Check if the user exists in the db
    const userData = await member.findOne({memberId: id}).exec(); // A clone object
    if(!userData) {
        const userObject = {memberId: id, username, joinedAt, savedPlaylists: [{name: playlistName, urls: []}]};
        const user = new member(userObject);
        await user.save();
        return message('PLAYLIST_CREATED', {playlistName});
    }
    // Make sure the playlist name isn't a duplicate
    if(userData.savedPlaylists.filter((playlist) => playlist.name == playlistName).length > 0) {
        return message('PLAYLIST_NAME_EXISTS', {playlistName});
    }

    // Create and save the playlist in the DB
    userData.savedPlaylists.push({name: playlistName, urls: []});
    try {
        await member.updateOne({memberId: interaction.member.id}, userData);
        return message('PLAYLIST_CREATED', {playlistName});
    } catch(e: unknown) {
        logger.error(e);
        return message('GENERIC_ERROR');
    }
};

