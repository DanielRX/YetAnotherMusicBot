import type {CustomInteraction} from '../../utils/types';
import {playerManager} from '../../utils/client';

export const name = 'remove';
export const description = 'Remove a specific song from queue';
export const deferred = false;

export const options = [
    {type: 'integer' as const, name: 'position', description: 'What song number do you want to remove from queue?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, position: number): Promise<void> => {
    const player = playerManager.get(interaction.guildId);

    if(!player) {
        return interaction.reply('There is nothing playing now!');
    }

    const voiceChannel = interaction.member.voice.channel;

    if(!voiceChannel) {
        return interaction.reply(':no_entry: Please join a voice channel and try again!');
    }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) {
        return interaction.reply(`:no_entry: You must be in the same voice channel as the bot in order to use that!`);
    }

    if(position < 1 || position > player.queue.length) {
        return interaction.reply('Please enter a valid position!');
    }

    player.queue.splice(position - 1, 1);
    return interaction.reply(`:wastebasket: Removed song number ${position} from queue!`);
};
