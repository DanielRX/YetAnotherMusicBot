import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import Member from '../../utils/models/Member';
import {setupOption} from '../../utils/utils';

export const name = 'create-playlist';
export const description = 'Create a custom playlist that you can play anytime';

export const options = [
    {name: 'playlistname', description: 'What is the name of the playlist you would like to create?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const playlistName = `${interaction.options.get('playlistname')?.value}`;
    const {member: {id, user: {username}, joinedAt}} = interaction;
    // Check if the user exists in the db
    const userData = await Member.findOne({memberId: id}).exec(); // A clone object
    if(!userData) {
        const userObject = {memberId: id, username, joinedAt, savedPlaylists: [{name: playlistName, urls: []}]};
        const user = new Member(userObject);
        user.save((err) => {
            if(err) { void interaction.reply('An error has occured, please try again later'); }
        });
        return interaction.reply(`Created a new playlist named **${playlistName}**`);
    }
    // Make sure the playlist name isn't a duplicate
    if(userData.savedPlaylists.filter((playlist) => playlist.name == playlistName).length > 0) {
        return interaction.reply(`There is already a playlist named **${playlistName}** in your saved playlists!`);
    }

    // Create and save the playlist in the DB
    userData.savedPlaylists.push({name: playlistName, urls: []});
    try {
        await Member.updateOne({memberId: interaction.member.id}, userData);
        return interaction.reply(`Created a new playlist named **${playlistName}**`);
    } catch(e: unknown) {
        console.error(e);
        return interaction.reply('There was a problem executing this command, please try again later');
    }
};

