import {readJSONSync} from 'fs-extra';

type Config = {token: string, mongoURI: string, clientId: string, geniusLyricsAPI: string, rawgAPI: string, newsAPI: string, tenorAPI: string, twitchClientID: string, twitchClientSecret: string };

export const config: Config = readJSONSync('../config.json');
