import type {CommandReturn, CustomInteraction} from '../../utils/types';
import member from '../../utils/models/Member';
import {MessageEmbed} from 'discord.js';

export const name = 'display-playlist';
export const description = 'Display a saved playlist';
export const deferred = true;

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'What is the name of the playlist you would like to display?', required: true, choices: []}
];

const maxLength = 24;

export const execute = async(interaction: CustomInteraction, playlistName: string): Promise<CommandReturn> => {
    // Check if user has playlists or if user is saved in the DB
    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) { return 'You have zero saved playlists!'; }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length === 0) { return 'You have zero saved playlists!'; }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location === -1) { return `You have no playlist named ${playlistName}`; }

    const urlsArrayClone = savedPlaylistsClone[location].urls;
    if(urlsArrayClone.length === 0) { return `**${playlistName}** is empty!`; }

    const savedPlaylistEmbed = new MessageEmbed().setColor('#ff7373').setTitle(playlistName).setTimestamp();
    const fields = urlsArrayClone.slice(0, maxLength).map((x, i) => ({name: `${i + 1}`, value: `${x.name}`}));
    savedPlaylistEmbed.setFields(fields);

    return {embeds: [savedPlaylistEmbed]};
};

