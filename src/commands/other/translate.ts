// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const ISO6391 = require('iso-639-1');
const translate = require('@vitalets/google-translate-api');
const {setupOption} = require('../../utils/utils');

const name = 'translate';
const description = 'Translate to any language using Google translate.';

const options = [
    {name: 'targetlang', description: 'What is the target language? (language you want to translate to)', required: true, choices: []},
    {name: 'text', description: 'What text do you want to translate?', required: true, choices: []}
];

const data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0])).addStringOption(setupOption(options[1]));

/**
 * @param {import('../../').CustomInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async(interaction) => {
    const targetLang = interaction.options.get('targetlang').value;
    const langCode = ISO6391.getCode(targetLang);

    if(langCode === '') {
        return interaction.reply(':x: Please provide a valid language!');
    }

    translate(interaction.options.get('text').value, {to: targetLang})
        .then((response) => {
            const embed = new MessageEmbed()
                .setColor('#FF0000')
                .setTitle('Google Translate: ')
                .setURL('https://translate.google.com/')
                .setDescription(response.text)
                .setFooter('Powered by Google Translate!');
            return interaction.reply({embeds: [embed]});
        })
        .catch((error) => {
            console.error(error);
            return interaction.reply(':x: Something went wrong when trying to translate the text');
        });
};

module.exports = {data, execute, name, description};
