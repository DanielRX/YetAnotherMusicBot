import {readJSONSync} from 'fs-extra';

type Config = {token: string, mongoURI: string, clientId: string, geniusLyricsAPI: string, rawgAPI: string, newsAPI: string, tenorAPI: string, twitchClientID: string, twitchClientSecret: string };

export const config = readJSONSync('./config.json') as Config;
