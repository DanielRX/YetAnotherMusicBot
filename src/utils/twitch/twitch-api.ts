import {fetch} from '../utils';
import {config} from '../config';
const {twitchClientID, twitchClientSecret} = config;

type Response<T> = {status: string, data: T[], access_token?: string}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class TwitchAPI {
    //Access Token is valid for 24 Hours

    static async getToken<T>(tClientID: string, tClientSecret: string, scope: string): Promise<string> {
        try {
            const json = await fetch<Response<T>>(`https://id.twitch.tv/oauth2/token?client_id=${tClientID}&client_secret=${tClientSecret}&grant_type=client_credentials&scope=${scope}`, {method: 'POST'}).then((res) => res.json());
            if(json.status == '400') {
                throw new Error('Something went wrong when trying to fetch a twitch access token');
            } else {
                return json.access_token || '';
            }
        } catch(e) {
            console.error(e);
            throw new Error('There was a problem fetching a token from the Twitch API');
        }
    }

    //userInfo.data[0]
    static async getUserInfo<T>(token: string, client_id: string, username: string): Promise<Response<T>> {
        try {
            const json = await fetch<Response<T>>(`https://api.twitch.tv/helix/users?login=${username}`, {method: 'GET', headers: {'client-id': `${client_id}`, Authorization: `Bearer ${token}`}}).then((res) => res.json());
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
    static async getStream<T>(token: string, client_id: string, userID: string): Promise<Response<T>> {
        try {
            const json = await fetch<Response<T>>(`https://api.twitch.tv/helix/streams?user_id=${userID}`, {method: 'GET', headers: {'client-id': `${client_id}`, Authorization: `Bearer ${token}`}}).then((res) => res.json());
            return json;
        } catch(e) {
            console.error(e);
            throw new Error('There was a problem fetching stream info from the Twitch API');
        }
    }

    static async getGames<T>(token: string, client_id: string, game_id: string): Promise<Response<T>> {
        try {
            const json = await fetch<Response<T>>(`https://api.twitch.tv/helix/games?id=${game_id}`, {method: 'GET', headers: {'client-id': `${client_id}`, Authorization: `Bearer ${token}`}}).then((res) => res.json());
            return json;
        } catch(e) {
            console.error(e);
            throw new Error('There was a problem fetching stream info from the Twitch API');
        }
    }
};

export default TwitchAPI;

const scope = 'user:read:email';

// Skips loading if not found in config.json
if(twitchClientID && twitchClientSecret) {
    // get first access_token
    void (async function() {
        await TwitchAPI.getToken(twitchClientID, twitchClientSecret, scope)
            .then((result: string) => {
                module.exports.access_token = result;
                return;
            })
            .catch((e: unknown) => {
                console.log(e);
                return;
            });
    })();
    // 24 Hour access_token refresh
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async function() {
        await TwitchAPI.getToken(twitchClientID, twitchClientSecret, scope)
            .then((result: string) => { module.exports.access_token = result; })
            .catch((e: unknown) => { console.log(e); });
    }, 86400000);
}
