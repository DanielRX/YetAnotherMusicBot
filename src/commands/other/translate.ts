import {MessageEmbed} from 'discord.js';
import ISO6391 from 'iso-639-1';
import translate from '@vitalets/google-translate-api';
import type {CommandReturn, CustomInteraction} from '../../utils/types';
import {logger} from '../../utils/logging';

export const name = 'translate';
export const description = 'Translate to any language using Google translate.';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'targetlang', description: 'What is the target language? (language you want to translate to)', required: true, choices: []},
    {type: 'string' as const, name: 'text', description: 'What text do you want to translate?', required: true, choices: []}
];

export const execute = async(interaction: CustomInteraction, targetLang: string, text: string): Promise<CommandReturn> => {
    const langCode = ISO6391.getCode(targetLang);

    if(langCode === '') { return ':x: Please provide a valid language!'; }

    translate(text, {to: targetLang})
        .then(async(response) => {
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Google Translate: ')
                .setURL('https://translate.google.com/')
                .setDescription(response.text)
                .setFooter('Powered by Google Translate!');
            return {embeds: [embed]};
        })
        .catch(async(e: unknown) => {
            logger.error(e);
            return ':x: Something went wrong when trying to translate the text';
        });
};

