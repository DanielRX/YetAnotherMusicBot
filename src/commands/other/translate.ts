import {SlashCommandBuilder} from '@discordjs/builders';
import {MessageEmbed} from 'discord.js';
import ISO6391 from 'iso-639-1';
import translate from '@vitalets/google-translate-api';
import {setupOption} from '../../utils/utils';
import type {CustomInteraction} from '../../utils/types';

export const name = 'translate';
export const description = 'Translate to any language using Google translate.';

export const options = [
    {name: 'targetlang', description: 'What is the target language? (language you want to translate to)', required: true, choices: []},
    {name: 'text', description: 'What text do you want to translate?', required: true, choices: []}
];

export const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addStringOption(setupOption(options[1]));

export const execute = async(interaction: CustomInteraction): Promise<void> => {
    const targetLang = `${interaction.options.get('targetlang')?.value}`;
    const langCode = ISO6391.getCode(targetLang);

    if(langCode === '') {
        return interaction.reply(':x: Please provide a valid language!');
    }

    translate(`${interaction.options.get('text')?.value}`, {to: targetLang})
        .then((response) => {
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Google Translate: ')
                .setURL('https://translate.google.com/')
                .setDescription(response.text)
                .setFooter('Powered by Google Translate!');
            return interaction.reply({embeds: [embed]});
        })
        .catch((e: unknown) => {
            console.error(e);
            return interaction.reply(':x: Something went wrong when trying to translate the text');
        });
};

