import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import {config} from '../../utils/config';

export const name = 'apod';
export const description = 'Get the astronomy photo of the day!';
export const deferred = false;

type APOD = {copyright: string, date: string, explanation: string, hdurl: string, media_type: 'image', service_version: 'v1', title: string, url: string}
const url = `https://api.nasa.gov/planetary/apod?api_key=${config.NASAKey}`;

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const json = await fetchJSON<APOD>(url);
    const embed = new MessageEmbed()
        .setAuthor(json.copyright, '', json.hdurl)
        .setDescription(json.explanation)
        .setTimestamp()
        .setTitle(`[${json.title}](${json.hdurl})`)
        .setImage(json.url)
        .setFooter(`${messages.POWERED_BY()} api.nasa.gov`, 'https://api.nasa.gov/assets/img/favicons/favicon-192.png');
    return {embeds: [embed]};
};

