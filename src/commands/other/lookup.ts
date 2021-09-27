import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {fetch, setupOption} from '../../utils/utils';

export const name = 'lookup';
export const description = 'Resolve an IP address or hostname with additional info.';

export const options = [
    {name: 'query', description: 'What do you want to lookup? Please enter a hostname/domain or IP address.', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const resl = `${interaction.options.get('query')?.value}`;

    try {
        const json = await fetch<{query: string, city: string, zip: string, regionName: string, country: string, org: string, isp: string, as: string}>(`http://ip-api.com/json/${resl}`).then((res) => res.json()); // fetch json data from ip-api.com

        //embed json results
        const embed = new MessageEmbed()
            .setColor('#42aaf5')
            .setAuthor('IP/Hostname Resolver', 'https://i.imgur.com/3lIiIv9.png', 'https://ip-api.com')
            .addFields([{name: 'Query', value: resl, inline: true},
                {name: 'Resolves', value: `${json.query}`, inline: true},
                {name: '‎', value: '‎', inline: true},
                {name: 'Location', value: `${json.city}, ${json.zip}, ${json.regionName}, ${json.country}`, inline: false},
                {name: 'ORG', value: `${json.org}‎`, inline: true}, // organisation who own the ip
                {name: 'ISP', value: `${json.isp}`, inline: true}, // internet service provider
                {name: 'OBO', value: json.as, inline: false}])
            .setTimestamp(); //img here

        return interaction.reply({embeds: [embed]});
    } catch(e: unknown) {
        console.error(e);
        return interaction.reply('Something went wrong looking for that result, is the api throttled?');
    }
};

