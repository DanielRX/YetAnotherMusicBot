import type {CustomInteraction} from '../../utils/types';
import {SlashCommandBuilder} from '@discordjs/builders';
import type {User} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import {setupOption} from '../../utils/utils';

export const name = 'avatar';
export const description = `Responds with a user's avatar`;

export const options = [
    {name: 'user', description: 'The user which avatar you want to display', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addUserOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const user = interaction.options.get('user')?.user as unknown as User;
    const embed = new MessageEmbed()
        .setTitle(user.username)
        .setImage(user.displayAvatarURL({dynamic: true}))
        .setColor('#00AE86');

    return interaction.reply({embeds: [embed]});
};
