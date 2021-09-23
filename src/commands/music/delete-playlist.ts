import type {CustomInteraction} from '../../utils/types';

// @ts-check
import {SlashCommandBuilder} from '@discordjs/builders';
import Member from '../../utils/models/Member';
import {setupOption} from '../../utils/utils';

export const name = 'delete-playlist';
export const description = 'Delete a playlist from your saved playlists';

export const options = [
    {name: 'playlistname', description: 'Which playlist would you like to delete?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const playlistName = interaction.options.get('playlistname')?.value;
    // Check if user has playlists or if user is saved in the DB
    const userData = await Member.findOne({memberId: interaction.member.id}).exec();

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
    await Member.updateOne({memberId: interaction.member.id}, {savedPlaylists: savedPlaylistsClone});
    return interaction.reply(`I removed **${playlistName}** from your saved playlists!`);
};
