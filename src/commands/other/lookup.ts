import {MessageEmbed} from 'discord.js';
import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';

export const name = 'lookup';
export const description = 'Resolve an IP address or hostname with additional info.';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'query', description: 'What do you want to lookup? Please enter a hostname/domain or IP address.', required: true, choices: []}
];

type Data = {query: string, city: string, zip: string, regionName: string, country: string, org: string, isp: string, as: string};

const embedColour = '#42aaf5';

export const execute = async({params: {query}}: CommandInput<{query: string}>): Promise<CommandReturn> => {
    const json = await fetchJSON<Data>(`http://ip-api.com/json/${query}`);

    //embed json results
    const embed = new MessageEmbed()
        .setColor(embedColour)
        .setAuthor('IP/Hostname Resolver', 'https://i.imgur.com/3lIiIv9.png', 'https://ip-api.com')
        .addFields([
            {name: 'Query', value: query, inline: true},
            {name: 'Resolves', value: `${json.query}`, inline: true},
            {name: '‎', value: '‎', inline: true},
            {name: 'Location', value: `${json.city}, ${json.zip}, ${json.regionName}, ${json.country}`, inline: false},
            {name: 'ORG', value: `${json.org}‎`, inline: true}, // organisation who own the ip
            {name: 'ISP', value: `${json.isp}`, inline: true}, // internet service provider
            {name: 'OBO', value: json.as, inline: false}])
        .setTimestamp(); //img here

    return {embeds: [embed]};
};

