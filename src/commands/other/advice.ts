import type {CommandReturn} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';

export const name = 'advice';
export const description = 'Get some advice!';
export const deferred = false;

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

export const execute = async(): Promise<CommandReturn> => {
    const json = await fetch<{slip: {advice: string}}>('https://api.adviceslip.com/advice').then(async(res) => res.json());
    const embed = new MessageEmbed()
        .setColor('#403B3A')
        .setAuthor('Advice Slip', 'https://i.imgur.com/8pIvnmD.png', 'https://adviceslip.com/')
        .setDescription(json.slip.advice)
        .setTimestamp()
        .setFooter('Powered by adviceslip.com', '');
    return {embeds: [embed]};
};

