import type {CommandInput, CommandReturn} from '../../utils/types';
import member from '../../utils/models/Member';

export const name = 'create-playlist';
export const description = 'Create a custom playlist that you can play anytime';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'What is the name of the playlist you would like to create?', required: true, choices: []}
];

export const execute = async({interaction, message, params: {playlistName}}: CommandInput<{playlistName: string}>): Promise<CommandReturn> => {
    const {member: {id, user: {username}, joinedAt}} = interaction;
    const playlistData = {name: playlistName, urls: []};
    // Check if the user exists in the db
    const userData = await member.findOne({memberId: id}).exec(); // A clone object
    if(!userData) {
        const userObject = {memberId: id, username, joinedAt, savedPlaylists: [playlistData]};
        const user = new member(userObject);
        await user.save();
        return message('PLAYLIST_CREATED', {playlistName});
    }
    // Make sure the playlist name isn't a duplicate
    if(userData.savedPlaylists.filter((playlist) => playlist.name == playlistName).length > 0) {
        return message('PLAYLIST_NAME_EXISTS', {playlistName});
    }

    // Create and save the playlist in the DB
    userData.savedPlaylists.push(playlistData);
    await member.updateOne({memberId: interaction.member.id}, userData);
    return message('PLAYLIST_CREATED', {playlistName});
};

