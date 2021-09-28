import type {CustomInteraction} from '../../utils/types';
import member from '../../utils/models/Member';

export const name = 'delete-playlist';
export const description = 'Delete a playlist from your saved playlists';

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'Which playlist would you like to delete?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, playlistName: string): Promise<void> => {
    // Check if user has playlists or if user is saved in the DB
    const userData = await member.findOne({memberId: interaction.member.id}).exec();

    if(!userData) {
        return interaction.reply('You have zero saved playlists!');
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length === 0) {
        return interaction.reply('You have zero saved playlists!');
    }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) {
        return interaction.reply(`You have no playlist named ${playlistName}`);
    }
    savedPlaylistsClone.splice(location, 1);
    await member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone});
    return interaction.reply(`I removed **${playlistName}** from your saved playlists!`);
};
