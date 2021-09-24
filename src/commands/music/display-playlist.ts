import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import Member from '../../utils/models/Member';
import type {Message} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import {setupOption} from '../../utils/utils';
import type {APIMessage} from 'discord-api-types';

export const name = 'display-playlist';
export const description = 'Display a saved playlist';

export const options = [
    {name: 'playlistname', description: 'What is the name of the playlist you would like to display?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message> => {
    void interaction.deferReply();
    const playlistName = `${interaction.options.get('playlistname')?.value}`;
    // Check if user has playlists or if user is saved in the DB
    const userData = await Member.findOne({memberId: interaction.member.id}).exec();
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
        const savedPlaylistEmbed = new MessageEmbed()
            .setColor('#ff7373')
            .setTitle(playlistName)
            .setTimestamp();
        const fields = urlsArrayClone.slice(0, 24).map((x, i) => ({name: `${i + 1}`, value: `${x.title}`}));
        savedPlaylistEmbed.setFields(fields);

        return interaction.followUp({embeds: [savedPlaylistEmbed]}); //TODO: Swap to reply?
    }
    return interaction.followUp(`You have no playlist named ${playlistName}`); //TODO: Swap to reply?
};

