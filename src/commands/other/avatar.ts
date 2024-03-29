import type {CommandInput, CommandReturn} from '../../utils/types';
import type {User} from 'discord.js';
import {MessageEmbed} from 'discord.js';

export const name = 'avatar';
export const description = `Responds with a user's avatar`;
export const deferred = false;

export const options = [
    {type: 'user' as const, name: 'user', description: 'The user which avatar you want to display', required: true, choices: []}
];

export const execute = async({params: {user}}: CommandInput<{user: User}>): Promise<CommandReturn> => {
    const embed = new MessageEmbed()
        .setTitle(user.username)
        .setImage(user.displayAvatarURL({dynamic: true}))
        .setColor('#00AE86');

    return {embeds: [embed]};
};
