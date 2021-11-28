import {MessageEmbed} from 'discord.js';
import ISO6391 from 'iso-639-1';
import translate from '@vitalets/google-translate-api';
import type {CommandInput, CommandReturn} from '../../utils/types';

export const name = 'translate';
export const description = 'Translate to any language using Google translate.';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'target-lang', description: 'What is the target language? (language you want to translate to)', required: true, choices: []},
    {type: 'string' as const, name: 'text', description: 'What text do you want to translate?', required: true, choices: []}
];

export const execute = async({params: {text, targetLang}, messages}: CommandInput<{targetLang: string, text: string}>): Promise<CommandReturn> => {
    const langCode = ISO6391.getCode(targetLang);

    if(langCode === '') { return ':x: Please provide a valid language!'; }

    const response = await translate(text, {to: targetLang});
    const embed = new MessageEmbed()
        .setColor('#FF0000')
        .setTitle('Google Translate: ')
        .setURL('https://translate.google.com/')
        .setDescription(response.text)
        .setFooter(`${messages.POWERED_BY} Google Translate!`);
    return {embeds: [embed]};
};

