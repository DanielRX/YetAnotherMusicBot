// @ts-check

const fetch = require('node-fetch'); // TODO: Switch to axios
/** @type {{twitchClientID: string, twitchClientSecret: string}} */
const config = require('../../../config.json');
const {twitchClientID, twitchClientSecret} = config;

// Skips loading if not found in config.json
if(!twitchClientID || !twitchClientSecret) { return; } // TODO: Fix this, won't play nice with ts

/**
 * @template T
 * @typedef Response
 * @type {{status: string, data: T[], access_token?: string}}
 */

/**
 * @template T
 * @typedef Res
 * @type {{json: () => Promise<Response<T>>}}
 */
/** */

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
module.exports = class TwitchAPI {
    //Access Token is valid for 24 Hours

    /**
     *
     *
     * @static
     * @template T
     * @param {string} tClientID
     * @param {string} tClientSecret
     * @param {string} scope
     * @return {Promise<string>}
     */
    static async getToken(tClientID, tClientSecret, scope) {
        try {
            /** @type {Response<T>} */
            // eslint-disable-next-line
            const json = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${tClientID}&client_secret=${tClientSecret}&grant_type=client_credentials&scope=${scope}`, {method: 'POST'}).then((res) => res.json());
            if(json.status == '400') {
                throw new Error('Something went wrong when trying to fetch a twitch access token');
            } else {
                return json.access_token;
            }
        } catch(e) {
            console.error(e);
            throw new Error('There was a problem fetching a token from the Twitch API');
        }
    }

    //userInfo.data[0]
    /**
     *
     *
     * @static
     * @template T
     * @param {string} token
     * @param {string} client_id
     * @param {string} username
     * @return {Promise<Response<T>>}
     */
    static async getUserInfo(token, client_id, username) {
        try {
            /** @type {Response<T>} */
            // eslint-disable-next-line
            const json = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {method: 'GET', headers: {'client-id': `${client_id}`, Authorization: `Bearer ${token}`}}).then((res) => res.json());
            if(json.status == `400`) {
                throw new Error(`:x: ${username} was Invalid, Please try again.`);
            }

            if(json.status == `429`) {
                throw new Error(`Rate Limit exceeded. Please try again in a few minutes.`);
            }

            if(json.status == `503`) {
                throw new Error(`Twitch service's are currently unavailable. Please try again later.`);
            }

            if(json.data[0] == null) {
                throw new Error(`Streamer ${username} was not found, Please try again.`);
            }
            return json;
        } catch(e) {
            console.error(e);
            throw new Error('There was a problem fetching user info from the Twitch API');
        }
    }

    // streamInfo.data[0]
    /**
     *
     *
     * @static
     * @template T
     * @param {string} token
     * @param {string} client_id
     * @param {string} userID
     * @return {Promise<Response<T>>}
     */
    static async getStream(token, client_id, userID) {
        try {
            /** @type {Response<T>} */
            // eslint-disable-next-line
            const json = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userID}`, {method: 'GET', headers: {'client-id': `${client_id}`, Authorization: `Bearer ${token}`}}).then((/** @type {{json: () => Promise<{status: string, data: any[]}>}} */ res) => res.json());
            return json;
        } catch(e) {
            console.error(e);
            throw new Error('There was a problem fetching stream info from the Twitch API');
        }
    }

    // gameInfo.data[0]
    /**
     *
     *
     * @static
     * @template T
     * @param {string} token
     * @param {string} client_id
     * @param {string} game_id
     * @return {Promise<Response<T>>}
     */
    static async getGames(token, client_id, game_id) {
        try {
            /** @type {Response<T>} */
            // eslint-disable-next-line
            const json = await fetch(`https://api.twitch.tv/helix/games?id=${game_id}`, {method: 'GET', headers: {'client-id': `${client_id}`, Authorization: `Bearer ${token}`}}).then((/** @type {Res<T>} */ res) => res.json());
            return json;
        } catch(e) {
            console.error(e);
            throw new Error('There was a problem fetching stream info from the Twitch API');
        }
    }
};

const TwitchAPI = require('./twitch-api.js'); // TODO: Fix - having this at the Top gives a Circular Error Message - Possible fix: Remove and use TwitchAPI from this file
const scope = 'user:read:email';
// get first access_token
void (async function() {
    await TwitchAPI.getToken(twitchClientID, twitchClientSecret, scope)
        .then((result) => {
            module.exports.access_token = result;
            return;
        })
        .catch((e) => {
            console.log(e);
            return;
        });
})();
// 24 Hour access_token refresh
// eslint-disable-next-line @typescript-eslint/no-misused-promises
setInterval(async function() {
    await TwitchAPI.getToken(twitchClientID, twitchClientSecret, scope)
        .then((result) => { module.exports.access_token = result; })
        .catch((e) => { console.log(e); });
}, 86400000);
