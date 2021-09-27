import {readJSONSync} from 'fs-extra';

type Options = {
    playLiveStreams: boolean,
    playVideosLongerThan1Hour: boolean,
    maxQueueLength: number,
    automaticallyShuffleYouTubePlaylists: boolean,
    leaveTimeOut: number,
    maxResponseTime: number,
    deleteOldPlayMessage: boolean
};

const opts: Options = readJSONSync('../options.json');

if(typeof opts.playLiveStreams !== 'boolean') opts.playLiveStreams = true;
if(typeof opts.maxQueueLength !== 'number' || opts.maxQueueLength < 1) { opts.maxQueueLength = 1000; }
if(typeof opts.leaveTimeOut !== 'number') { opts.leaveTimeOut = 90; }
if(typeof opts.maxResponseTime !== 'number') { opts.maxResponseTime = 30; }
if(typeof opts.automaticallyShuffleYouTubePlaylists !== 'boolean') { opts.automaticallyShuffleYouTubePlaylists = false; }
if(typeof opts.playVideosLongerThan1Hour !== 'boolean') { opts.playVideosLongerThan1Hour = true; }
if(typeof opts.deleteOldPlayMessage !== 'boolean') { opts.deleteOldPlayMessage = false; }

opts.leaveTimeOut = Math.max(Math.min(opts.leaveTimeOut, 600), 1);
opts.maxResponseTime = Math.max(Math.min(opts.maxResponseTime, 150), 5);

export const options = opts;
