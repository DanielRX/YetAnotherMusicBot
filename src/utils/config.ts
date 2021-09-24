type Config = {token: string, mongo_URI: string, client_id: string, geniusLyricsAPI: string, rawgAPI: string, newsAPI: string, tenorAPI: string, twitchClientID: string, twitchClientSecret: string };

export const config: Config = require('../config.json');
