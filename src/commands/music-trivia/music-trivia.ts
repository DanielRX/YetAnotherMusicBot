import {joinVoiceChannel, VoiceConnectionStatus, entersState} from '@discordjs/voice';
import type {BaseGuildTextChannel, VoiceChannel} from 'discord.js';
import {MessageEmbed} from 'discord.js';
import {playerManager, triviaManager} from '../../utils/client';
import TriviaPlayer from '../../utils/music/TriviaPlayer';
import type {CustomInteraction, CommandReturn, CommandInput} from '../../utils/types';
import {logger} from '../../utils/logging';

export const name = 'music-trivia';
export const description = 'Engage in a music quiz with your friends!';
export const deferred = true;

export const options = [
    {type: 'string', name: 'length', description: 'How many songs would you like the trivia to have?', required: false, choices: [], default: 25},
    {type: 'boolean', name: 'hard', description: 'Super strict answer mode', required: false, choices: [], default: false},
    {type: 'boolean', name: 'round-mode', description: 'Play forever with rounds', required: false, choices: [], default: false},
    {type: 'string', name: 'twitch-channel', description: 'Which twitch channel would you like to listen to?', required: false, choices: [], default: ''},
] as const;

const embedColour = '#ff7373';

const handleSubscription = async(interaction: CustomInteraction, player: TriviaPlayer, desc: string, errorMsg: string): Promise<CommandReturn> => {
    const {queue} = player;
    const {voiceChannel} = queue[0];

    const connection = joinVoiceChannel({channelId: voiceChannel?.id ?? '', guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator});

    player.textChannel = interaction.channel as BaseGuildTextChannel;
    player.passConnection(connection);
    try {
        await entersState(player.connection, VoiceConnectionStatus.Ready, 10000);
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(errorMsg);
    }
    void player.process(player.queue);

    const startTriviaEmbed = new MessageEmbed().setColor(embedColour).setTitle(':notes: Starting Music Quiz!').setDescription(desc);
    return {embeds: [startTriviaEmbed]};
};

export const execute = async({interaction, guildId, messages, params: {length, hard, roundMode, twitchChannel}}: CommandInput<{length: number, hard: boolean, roundMode: boolean, twitchChannel: string}>): Promise<CommandReturn> => {
    const voiceChannel = interaction.member.voice.channel;
    if(!voiceChannel) { return messages.NOT_IN_VC(); }
    if(playerManager.has(guildId)) { return messages.TRACK_IS_PLAYING(); }
    if(triviaManager.has(guildId)) { return messages.TRIVIA_IS_RUNNING(); }

    triviaManager.set(guildId, new TriviaPlayer(hard, roundMode, twitchChannel, voiceChannel as VoiceChannel));

    const triviaPlayer = triviaManager.get(guildId) as unknown as TriviaPlayer;
    await triviaPlayer.loadSongs(length);
    // eslint-disable-next-line @typescript-eslint/no-shadow

    const membersInChannel = interaction.member.voice.channel?.members;

    membersInChannel?.each((user) => {
        if(user.user.bot) { return; }
        triviaPlayer.score.set(`d:${user.user.username.toLowerCase()}`, 0);
    });

    // play and display embed that says trivia started and how many songs are going to be
    return handleSubscription(interaction, triviaPlayer, messages.START({length: triviaPlayer.queue.length}), messages.FAILED_TO_JOIN());
};

