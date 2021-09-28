import {MessageEmbed} from 'discord.js';
import type {CustomInteraction} from '../../utils/types';
import {fetch} from '../../utils/utils';
import {logger} from '../../utils/logging';

export const name = 'covid';
export const description = 'Displays COVID-19 stats.';

export const options = [
    {type: 'string' as const, name: 'country', description: 'What country do you like to search? Type `all` to display worldwide stats.', required: false, choices: [], default: 'all'}
];

type WorldStats = {todayCases: number, todayDeaths: number, recovered: number, deaths: number, active: number, cases: number, tests: number, casesPerOneMillion: number, deathsPerOneMillion: number, updated: number};
type CountryStats = WorldStats & {country: string, countryInfo: {flag: string}};

const getWorldStats = async() => {
    const url = 'https://disease.sh/v3/covid-19/all';
    try {
        const body = await fetch<WorldStats>(url);
        if(body.status != '200') {
            throw new Error(`The covid API can't be accessed at the moment, please try later`);
        }
        const json = await body.json();
        return json;
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(`The covid API can't be accessed at the moment, please try later`);
    }
};
const getCountryStats = async(country: string) => {
    const url = `https://disease.sh/v3/covid-19/countries/${country}`;
    try {
        const body = await fetch<CountryStats>(url);
        if(body.status != '200') {
            throw new Error(`There was a problem getting data from the API, make sure you entered a valid country name`);
        }
        const json = await body.json();
        return json;
    } catch(e: unknown) {
        logger.error(e);
        throw new Error(`There was a problem getting data from the API, make sure you entered a valid country name`);
    }
};

export const execute = async(interaction: CustomInteraction, country: string): Promise<void> => {
    if(country === 'all' || country === 'world' || country === 'global') {
        return getWorldStats()
            .then(async(res) => {
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
            .catch(async function onError(err) {
                logger.error(err);
                return interaction.reply('Something went wrong!');
            });
    }
    await getCountryStats(country)
        .then(async(res) => {
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
        .catch(async(e: unknown) => {
            logger.error(e);
            return interaction.reply('Something went wrong!');
        });
};
