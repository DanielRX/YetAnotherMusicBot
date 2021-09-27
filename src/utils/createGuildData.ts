// @ts-check

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => {
    return {
        queueHistory: [],
        triviaData: {
            isTriviaRunning: false,
            wasTriviaEndCalled: false,
            triviaQueue: [],
            triviaScore: new Map()
        },
        twitchData: {
            interval: null,
            embedStatus: null,
            isRunning: false
        },
        gameData: {
            connect4Players: new Map(),
            tictactoePlayers: new Map()
        }
    };
};
