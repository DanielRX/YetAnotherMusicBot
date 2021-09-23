// @ts-check
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {setupOption, fetch} = require('../../utils/utils');

export const name = 'covid';
export const description = 'Displays COVID-19 stats.';

export const options = [
    {name: 'country', description: 'What country do you like to search? Type `all` to display worldwide stats.', required: true, choices: []}
];

export const datast data = new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(setupOption(options[0]));

const getWorldStats = async() => {
    const url = 'https://disease.sh/v3/covid-19/all';
    try {
        const body = await fetch(url);
        if(body.status !== 200) {
            throw new Error(`The covid API can't be accessed at the moment, please try later`);
        }
        const json = await body.json();
        return json;
    } catch(e) {
        console.error(e);
        throw new Error(`The covid API can't be accessed at the moment, please try later`);
    }
};
const getCountryStats = async(country) => {
    const url = `https://disease.sh/v3/covid-19/countries/${country}`;
    try {
        const body = await fetch(url);
        if(body.status !== 200) {
            throw new Error(`There was a problem getting data from the API, make sure you entered a valid country name`);
        }
        const json = await body.json();
        return json;
    } catch(e) {
        console.error(e);
        throw new Error(`There was a problem getting data from the API, make sure you entered a valid country name`);
    }
};

/**
     * @param {import('../..').CustomInteraction} interaction
     * @returns {Promise<void>}
     */
export const execute = async(interaction) => {
    const country = interaction.options.get('country').value;
    if(country === 'all' || country === 'world' || country === 'global') {
        return getWorldStats()
            .then((res) => {
                const covidall = new MessageEmbed()
                    .setTitle('Worldwide Stats')
                    .setColor('RANDOM')
                    .setThumbnail('https://i.imgur.com/a4014ev.png') // World Globe image
                    .addField('Total cases', res.cases.toLocaleString(), true)
                    .addField('Cases today', res.todayCases.toLocaleString(), true)
                    .addField('Deaths today', res.todayDeaths.toLocaleString(), true)
                    .addField('Active cases', `${res.active.toLocaleString()} (${((res.active / res.cases) * 100).toFixed(2)}%)`, true)
                    .addField('Total recovered', `${res.recovered.toLocaleString()} (${((res.recovered / res.cases) * 100).toFixed(2)}%)`, true)
                    .addField('Total deaths', `${res.deaths.toLocaleString()} (${((res.deaths / res.cases) * 100).toFixed(2)}%)`, true)
                    .addField('Tests', `${res.tests.toLocaleString()}`, true)
                    .addField('Cases Per Mil', `${res.casesPerOneMillion.toLocaleString()}`, true)
                    .addField('Deaths Per Mil', `${res.deathsPerOneMillion.toLocaleString()}`, true)
                    .addField('Public advice', '[Click here](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public)')
                    .setFooter('Last updated')
                    .setTimestamp(res.updated);

                return interaction.reply({embeds: [covidall]});
            })
            .catch(function onError(err) {
                console.error(err);
                return interaction.reply('Something went wrong!');
            });
    }
    await getCountryStats(country)
        .then((res) => {
            const covidcountry = new MessageEmbed()
                .setTitle(`Country Stats for ${res.country}`)
                .setColor('RANDOM')
                .setThumbnail(res.countryInfo.flag)
                .addField('Total cases', res.cases.toLocaleString(), true)
                .addField('Cases today', res.todayCases.toLocaleString(), true)
                .addField('Deaths today', res.todayDeaths.toLocaleString(), true)
                .addField('Active cases', `${res.active.toLocaleString()} (${((res.active / res.cases) * 100).toFixed(2)}%)`, true)
                .addField('Total recovered', `${res.recovered.toLocaleString()} (${((res.recovered / res.cases) * 100).toFixed(2)}%)`, true)
                .addField('Total deaths', `${res.deaths.toLocaleString()} (${((res.deaths / res.cases) * 100).toFixed(2)}%)`, true)
                .addField('Tests', `${res.tests.toLocaleString()}`, true)
                .addField('Cases Per Mil', `${res.casesPerOneMillion.toLocaleString()}`, true)
                .addField('Deaths Per Mil', `${res.deathsPerOneMillion.toLocaleString()}`, true)
                .addField('Public advice', '[Click here](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public)')
                .setFooter('Last updated')
                .setTimestamp(res.updated);

            return interaction.reply({embeds: [covidcountry]});
        })
        .catch(function onError(err) {
            console.error(err);
            return interaction.reply('Something went wrong!');
        });
};


