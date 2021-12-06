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
        }
    };
};
