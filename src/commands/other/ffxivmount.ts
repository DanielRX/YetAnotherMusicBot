import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetchJSON} from '../../utils/utils';
import {MessageEmbed} from 'discord.js';

export const name = 'getffxivmount';
export const description = 'Get the info on a mount!';
export const deferred = false;

type FFXIVInfo = {
  id: number,
  name: string,
  description: string,
  enhanced_description: string,
  tooltip: string,
  movement: string,
  seats: number,
  order: number,
  order_group: number,
  patch: string,
  item_id: null,
  owned: string,
  image: string,
  icon: string,
  sources: {type: string, text: string, related_type: string, related_id: number}[]
}

export const options = [
    {type: 'integer' as const, name: 'mount-id', description: 'Which mount do you want to see?', required: true, choices: []}
];

const url = `https://ffxivcollect.com/api/`;

export const execute = async({messages, params: {mountId}}: CommandInput<{mountId: number}>): Promise<CommandReturn> => {
    const json = await fetchJSON<FFXIVInfo>(`${url}/mounts/${mountId}`);
    const embed = new MessageEmbed()
        // .setAuthor(json.name, '')
        .setDescription(json.enhanced_description)
        .setTimestamp()
        .setTitle(json.name)
        .setURL(json.image)
        .setImage(json.image)
        .setFooter(`${messages.POWERED_BY()} ffxivcollect.com`, 'https://ffxivcollect.com/assets/logo-041d12c9c99146d118486d15837336d90ec32dba6a1a498309fb27736d184687.png');
    return {embeds: [embed]};
};
