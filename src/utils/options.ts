type Options = {
    playLiveStreams: boolean,
    playVideosLongerThan1Hour: boolean,
    maxQueueLength: number,
    AutomaticallyShuffleYouTubePlaylists: boolean,
    LeaveTimeOut: number,
    MaxResponseTime: number,
    deleteOldPlayMessage: boolean
};

const opts: Options = require('../options.json');

if(typeof opts.playLiveStreams !== 'boolean') opts.playLiveStreams = true;
if(typeof opts.maxQueueLength !== 'number' || opts.maxQueueLength < 1) { opts.maxQueueLength = 1000; }
if(typeof opts.LeaveTimeOut !== 'number') { opts.LeaveTimeOut = 90; }
if(typeof opts.MaxResponseTime !== 'number') { opts.MaxResponseTime = 30; }
if(typeof opts.AutomaticallyShuffleYouTubePlaylists !== 'boolean') { opts.AutomaticallyShuffleYouTubePlaylists = false; }
if(typeof opts.playVideosLongerThan1Hour !== 'boolean') { opts.playVideosLongerThan1Hour = true; }
if(typeof opts.deleteOldPlayMessage !== 'boolean') { opts.deleteOldPlayMessage = false; }

opts.LeaveTimeOut = Math.max(Math.min(opts.LeaveTimeOut, 600), 1);
opts.MaxResponseTime = Math.max(Math.min(opts.MaxResponseTime, 150), 5);

export const options = opts;
