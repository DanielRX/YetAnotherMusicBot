import axios from 'axios';

import type {CommandInput, CommandReturn} from '../../utils/types';
import {MessageEmbed} from 'discord.js';
import {logger} from '../../utils/logging';

export const name = 'crypto';
export const description = `Responds with a user's avatar`;
export const deferred = false;

export const options = [
    {type: 'string' as const, name: 'crypto', description: 'The crypto you want the price of', required: false, choices: [], default: ''},
    {type: 'boolean' as const, name: 'prod', description: 'Use prod or dev API', required: false, choices: [], default: false}
];

type Coin = {symbol: string, price: number[]};

let lastUpdate = 0;
let lastUpdateProd = 0;

let data: Coin[] = [];
let dataProd: Coin[] = [];

const requestOptions = {
    qs: {start: '1', limit: '200', convert: 'USD'},
    headers: {
        'X-CMC_PRO_API_KEY': process.env.CMC_KEY
    },
    json: true,
    gzip: true
};
const sandBoxRequestOptions = {
    qs: {start: '1', limit: '200', convert: 'USD'},
    headers: {
        'X-CMC_PRO_API_KEY': 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c'
    },
    json: true,
    gzip: true
};

const checkUpdate = async(prod = false) => {
    if(prod) {
        if((Date.now() - lastUpdateProd) < 30 * 1000) { return; }
        lastUpdateProd = Date.now();
    } else {
        if((Date.now() - lastUpdate) < 30 * 1000) { return; }
        lastUpdate = Date.now();
    }
    logger.info(`Polling for crypto, prod = ${prod}`);
    let response = {};
    if(prod) {
        response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', requestOptions);
    } else {
        response = await axios.get('https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', sandBoxRequestOptions);
    }
    const coins = response.data.data.map((coin: any) => {
        const {id, name, symbol, quote: {USD: {price, percent_change_1h: change1, percent_change_24h: change24, percent_change_7d: change7}}} = coin;
        const priceData = [price, change1, change24, change7];
        return {id, name, symbol, price: priceData};
    });
    if(prod) {
        dataProd = coins;
    } else {
        data = coins;
    }
};
const cleanCoin = (x: Coin) => {
    const {symbol, price} = x;
    return {symbol, price};
};

const f = (coin: Coin) => {
    const {price, symbol} = coin;
    const [usd, h1, h24, d7] = price;
    const changes = [h1, h24, d7].map((x) => `${x > 0 ? '↑' : x < 0 ? '↓' : '→'} ${x.toFixed(1)}%`);
    const priceInUSD = usd.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 2});
    const value = `${priceInUSD} | 1hr: ${changes[0]} | 24hr: ${changes[1]} | 7d: ${changes[2]}`;
    return {name: symbol, value};
};

export const execute = async({params: {prod, crypto}}: CommandInput<{prod: boolean, crypto: string}>): Promise<CommandReturn> => {
    await checkUpdate(prod);
    if(crypto === '') {
        const fields = (prod ? dataProd : data).slice(0, 5).map(cleanCoin).map(f);
        const embed = new MessageEmbed().setTitle('Prices').setColor(16711680).setFields(fields);
        return {embeds: [embed]};
    }
    const fields2 = (prod ? dataProd : data).filter((coin) => coin.symbol === crypto).map(cleanCoin).map(f);
    return `\`\`\`\n${fields2[0].name}\n${fields2[0].value}\`\`\``;
};
