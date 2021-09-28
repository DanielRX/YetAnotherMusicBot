import {playerManager} from '../../utils/client';
import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {shuffleArray} from '../../utils/utils';

export const name = 'shuffle';
export const description = 'Shuffle the music queue!';
export const deferred = true;

export const execute = async(interaction: CustomInteraction): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return `:no_entry: You must be in the same voice channel as the bot in order to use that!`; }
    if(voiceChannel.id !== interaction.guild.me?.voice.channel?.id) { return `:no_entry: You must be in the same voice channel as the bot in order to use that!`; }
    const player = playerManager.get(interaction.guildId);
    if(!player) { return ':x: There is nothing playing right now!'; }
    if(player.loopSong) { return ':x: Turn off the **loop** command before using the **shuffle** command!'; }
    if(player.queue.length < 1) { return 'There are no songs in queue!'; }
    if(player.commandLock) { return 'Please wait until play command is done processing'; }

    shuffleArray(player.queue);

    return 'The music queue has been shuffled!';
};

