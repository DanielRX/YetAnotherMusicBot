import type {CustomInteraction} from '../../utils/types';
import member from '../../utils/models/Member';
import type {Message} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import type {APIMessage} from 'discord-api-types';

export const name = 'display-playlist';
export const description = 'Display a saved playlist';

export const options = [
    {type: 'string' as const, name: 'playlistname', description: 'What is the name of the playlist you would like to display?', required: true, choices: []}
];

const maxLength = 24;

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message> => {
    void interaction.deferReply();
    const playlistName = `${interaction.options.get('playlistname')?.value}`;
    // Check if user has playlists or if user is saved in the DB
    const userData = await member.findOne({memberId: interaction.member.id}).exec();
    if(!userData) {
        return interaction.followUp('You have zero saved playlists!'); //TODO: Swap to reply?
    }
    const savedPlaylistsClone = userData.savedPlaylists;
    if(savedPlaylistsClone.length === 0) {
        return interaction.followUp('You have zero saved playlists!'); //TODO: Swap to reply?
    }

    const location = savedPlaylistsClone.findIndex((value) => value.name == playlistName);
    if(location !== -1) {
        const urlsArrayClone = savedPlaylistsClone[location].urls;
        if(urlsArrayClone.length === 0) {
            return interaction.followUp(`**${playlistName}** is empty!`); //TODO: Swap to reply?
        }
        const savedPlaylistEmbed = new MessageEmbed().setColor('#ff7373').setTitle(playlistName).setTimestamp();
        const fields = urlsArrayClone.slice(0, maxLength).map((x, i) => ({name: `${i + 1}`, value: `${x.name}`}));
        savedPlaylistEmbed.setFields(fields);

        return interaction.followUp({embeds: [savedPlaylistEmbed]}); //TODO: Swap to reply?
    }
    return interaction.followUp(`You have no playlist named ${playlistName}`); //TODO: Swap to reply?
};

