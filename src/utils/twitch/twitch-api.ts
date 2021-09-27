/* eslint-disable @typescript-eslint/naming-convention */
import {fetch} from '../utils';
import {config} from '../config';
const {twitchClientID, twitchClientSecret} = config;

type Response<T> = {status: string, data: T[], access_token?: string}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class TwitchAPI {
    //Access Token is valid for 24 Hours

    public static async getToken<T>(tClientID: string, tClientSecret: string, scope: string): Promise<string> {
        try {
            const json = await fetch<Response<T>>(`https://id.twitch.tv/oauth2/token?client_id=${tClientID}&client_secret=${tClientSecret}&grant_type=client_credentials&scope=${scope}`, {method: 'POST'}).then(async(res) => res.json());
            if(json.status == '400') {
                throw new Error('Something went wrong when trying to fetch a twitch access token');
            } else {
                return json.access_token ?? '';
            }
        } catch(e: unknown) {
            console.error(e);
            throw new Error('There was a problem fetching a token from the Twitch API');
        }
    }

    //userInfo.data[0]
    public static async getUserInfo<T>(token: string, clientId: string, username: string): Promise<Response<T>> {
        try {
            const json = await fetch<Response<T>>(`https://api.twitch.tv/helix/users?login=${username}`, {method: 'GET', headers: {'client-id': `${clientId}`, Authorization: `Bearer ${token}`}}).then(async(res) => res.json());
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
        } catch(e: unknown) {
            console.error(e);
            throw new Error('There was a problem fetching user info from the Twitch API');
        }
    }

    // streamInfo.data[0]
    public static async getStream<T>(token: string, clientId: string, userId: string): Promise<Response<T>> {
        try {
            const json = await fetch<Response<T>>(`https://api.twitch.tv/helix/streams?user_id=${userId}`, {method: 'GET', headers: {'client-id': `${clientId}`, Authorization: `Bearer ${token}`}}).then(async(res) => res.json());
            return json;
        } catch(e: unknown) {
            console.error(e);
            throw new Error('There was a problem fetching stream info from the Twitch API');
        }
    }

    public static async getGames<T>(token: string, clientId: string, gameId: string): Promise<Response<T>> {
        try {
            const json = await fetch<Response<T>>(`https://api.twitch.tv/helix/games?id=${gameId}`, {method: 'GET', headers: {'client-id': `${clientId}`, Authorization: `Bearer ${token}`}}).then(async(res) => res.json());
            return json;
        } catch(e: unknown) {
            console.error(e);
            throw new Error('There was a problem fetching stream info from the Twitch API');
        }
    }
};

export default TwitchAPI;

export const twitchData = {accessToken: ''};

const scope = 'user:read:email';
const day = 86400000;
// Skips loading if not found in config.json
if(twitchClientID && twitchClientSecret) {
    // get first access_token
    void (async(): Promise<void> => {
        await TwitchAPI.getToken(twitchClientID, twitchClientSecret, scope)
            .then((result: string) => {
                twitchData.accessToken = result;
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
            .then((result: string) => { twitchData.accessToken = result; })
            .catch((e: unknown) => { console.log(e); });
    }, day);
}
