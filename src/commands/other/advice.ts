import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';

export const name = 'advice';
export const description = 'Get some advice!';
export const deferred = false;

export const data = new SlashCommandBuilder().setName(name).setDescription(description);

const url = 'https://api.adviceslip.com/advice';

const embedColour = '#403B3A';

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const json = await fetchJSON<{slip: {advice: string}}>(url);
    const embed = new MessageEmbed()
        .setColor(embedColour)
        .setAuthor('Advice Slip', 'https://i.imgur.com/8pIvnmD.png', 'https://adviceslip.com/')
        .setDescription(json.slip.advice)
        .setTimestamp()
        .setFooter(`${messages.POWERED_BY()} adviceslip.com`, '');
    return {embeds: [embed]};
};

