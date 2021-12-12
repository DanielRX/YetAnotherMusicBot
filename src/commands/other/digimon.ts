import type {CommandInput, CommandReturn, DigimonInfo} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'digimon';
export const description = 'Get the info on a digimon!';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'name', description: 'Which digimon do you want to see?', required: true, choices: []}
];

const url = `https://digimon-api.vercel.app/api/digimon/name/`;

export const execute = async({messages, params: {name: digimon}}: CommandInput<{name: string}>): Promise<CommandReturn> => {
    const [json] = await fetchJSON<DigimonInfo[]>(`${url}/${digimon}`);
    const embed = new MessageEmbed()
        .setDescription(json.level)
        .setTimestamp()
        .setTitle(json.name)
        .setImage(json.img)
        .setFooter(`${messages.POWERED_BY()} digimon-api.vercel.app`);
    return {embeds: [embed]};
};
