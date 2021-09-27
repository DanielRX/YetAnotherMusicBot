import type {APIMessage} from 'discord-api-types';
import type {Message} from 'discord.js';
import {playerManager} from '../../utils/client';
import type {CustomInteraction} from '../../utils/types';

export const name = 'skip-to';
export const description = 'Skip to a song in queue';

export const options = [
    {type: 'integer' as const, name: 'position', description: 'What is the position in queue you want to skip to?', required: true, choices: []},
];

export const execute = async(interaction: CustomInteraction): Promise<APIMessage | Message> => {
    void interaction.deferReply();
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return interaction.followUp(`:no_entry: You must be in the same voice channel as the bot in order to use that!`); }
    if(voiceChannel.id !== interaction.member.voice.channelId) { return interaction.followUp(`:no_entry: You must be in the same voice channel as the bot in order to use that!`); }
    const player = playerManager.get(interaction.guildId);
    if(!player) { return interaction.followUp(':x: There is nothing playing right now!'); }
    if(player.queue.length < 1) { return interaction.followUp('There are no songs in queue!'); }

    const position = Number(interaction.options.get('position')?.value);

    if(player.loopQueue) {
        const slicedBefore = player.queue.slice(0, position - 1);
        const slicedAfter = player.queue.slice(position - 1);
        player.queue = slicedAfter.concat(slicedBefore);
    } else {
        player.queue.splice(0, position - 1);
        player.loopSong = false;
    }
    player.audioPlayer.stop();
    return interaction.followUp(`Skipped to **${player.queue[0].name}**`);
};

