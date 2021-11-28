import {MessageEmbed} from 'discord.js';
import type {CommandInput, CommandReturn} from '../../utils/types';
import {fetch} from '../../utils/utils';

export const name = 'covid';
export const description = 'Displays COVID-19 stats.';
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'country', description: 'What country do you like to search? Type `all` to display worldwide stats.', required: false, choices: [], default: 'all'}
];

type WorldStats = {todayCases: number, todayDeaths: number, recovered: number, deaths: number, active: number, cases: number, tests: number, casesPerOneMillion: number, deathsPerOneMillion: number, updated: number};
type CountryStats = WorldStats & {country: string, countryInfo: {flag: string}};

const baseUrl = `https://disease.sh/v3/covid-19`;

const getWorldStats = async() => {
    const url = `${baseUrl}/all`;
    const body = await fetch<WorldStats>(url);
    if(body.status != '200') {
        throw new Error(`The covid API can't be accessed at the moment, please try later`);
    }
    return body.json();
};
const getCountryStats = async(country: string) => {
    const url = `${baseUrl}/countries/${country}`;
    const body = await fetch<CountryStats>(url);
    if(body.status != '200') {
        throw new Error(`There was a problem getting data from the API, make sure you entered a valid country name`);
    }
    return body.json();
};

const ratioToPercStr = (x: number) => `${(x * 100).toFixed(2)}%`;
const toStr = (x: number) => x.toLocaleString();

const makeEmbed = (res: WorldStats) => new MessageEmbed()
    .setColor('RANDOM')
    .addField('Total cases', toStr(res.cases), true)
    .addField('Cases today', toStr(res.todayCases), true)
    .addField('Deaths today', toStr(res.todayDeaths), true)
    .addField('Active cases', `${toStr(res.active)} (${ratioToPercStr(res.active / res.cases)})`, true)
    .addField('Total recovered', `${toStr(res.recovered)} (${ratioToPercStr(res.recovered / res.cases)})`, true)
    .addField('Total deaths', `${toStr(res.deaths)} (${ratioToPercStr(res.deaths / res.cases)})`, true)
    .addField('Tests', `${toStr(res.tests)}`, true)
    .addField('Cases Per Mil', `${toStr(res.casesPerOneMillion)}`, true)
    .addField('Deaths Per Mil', `${toStr(res.deathsPerOneMillion)}`, true)
    .addField('Public advice', '[Click here](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public)')
    .setFooter('Last updated')
    .setTimestamp(res.updated);

export const execute = async({params: {country}}: CommandInput<{country: string}>): Promise<CommandReturn> => {
    if(country === 'all' || country === 'world' || country === 'global') {
        const res = await getWorldStats();
        const covidall = makeEmbed(res)
            .setTitle('Worldwide Stats')
            .setThumbnail('https://i.imgur.com/a4014ev.png'); // World Globe image

        return {embeds: [covidall]};
    }
    const res = await getCountryStats(country);
    const covidcountry = makeEmbed(res)
        .setTitle(`Country Stats for ${res.country}`)
        .setThumbnail(res.countryInfo.flag);

    return {embeds: [covidcountry]};
};
