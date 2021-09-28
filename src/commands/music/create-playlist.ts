import type {CommandReturn, CustomInteraction} from '../../utils/types';
import member from '../../utils/models/Member';
import {logger} from '../../utils/logging';

export const name = 'create-playlist';
export const description = 'Create a custom playlist that you can play anytime';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'What is the name of the playlist you would like to create?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, playlistName: string): Promise<CommandReturn> => {
    const {member: {id, user: {username}, joinedAt}} = interaction;
    // Check if the user exists in the db
    const userData = await member.findOne({memberId: id}).exec(); // A clone object
    if(!userData) {
        const userObject = {memberId: id, username, joinedAt, savedPlaylists: [{name: playlistName, urls: []}]};
        const user = new member(userObject);
        await user.save();
        return `Created a new playlist named **${playlistName}**`;
    }
    // Make sure the playlist name isn't a duplicate
    if(userData.savedPlaylists.filter((playlist) => playlist.name == playlistName).length > 0) {
        return `There is already a playlist named **${playlistName}** in your saved playlists!`;
    }

    // Create and save the playlist in the DB
    userData.savedPlaylists.push({name: playlistName, urls: []});
    try {
        await member.updateOne({memberId: interaction.member.id}, userData);
        return `Created a new playlist named **${playlistName}**`;
    } catch(e: unknown) {
        logger.error(e);
        return 'There was a problem executing this command, please try again later';
    }
};

