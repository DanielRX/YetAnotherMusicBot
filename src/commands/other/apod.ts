import type {APODData, CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';
import {config} from '../../utils/config';

export const name = 'apod';
export const description = 'Get the astronomy photo of the day!';
export const deferred = false;

const url = `https://api.nasa.gov/planetary/apod?api_key=${config.NASAKey}`;

export const execute = async({messages}: CommandInput): Promise<CommandReturn> => {
    const json = await fetchJSON<APODData>(url);
    const embed = new MessageEmbed()
        .setAuthor(json.copyright || 'NASA', '')
        .setDescription(json.explanation)
        .setTitle(json.title)
        .setURL(json.hdurl)
        .setImage(json.url)
        .setFooter(`${messages.POWERED_BY()} api.nasa.gov`, 'https://api.nasa.gov/assets/img/favicons/favicon-192.png')
        .setTimestamp();
    return {embeds: [embed]};
};

