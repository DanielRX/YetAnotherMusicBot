import {readJSONSync} from 'fs-extra';

type Config = {NASAKey: string, token: string, mongoURI: string, clientId: string, geniusLyricsAPI: string, rawgAPI: string, newsAPI: string, tenorAPI: string, twitchClientID: string, twitchClientSecret: string, twitchUsername: string, twitchToken: string, CMCKey: string};

export const config = readJSONSync('./config.json') as Config;
