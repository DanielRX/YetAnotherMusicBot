import winston from 'winston';

const myFormat = winston.format.printf(({level, message, timestamp}) => {
    return `${timestamp} ${level.toUpperCase()} ${typeof message === 'string' ? JSON.stringify({message}) : JSON.stringify(message)}`;
});

const myConsoleFormat = winston.format.printf(({level, message, timestamp}) => {
    return `${timestamp} ${level.toUpperCase()} ${typeof message === 'string' ? message : '[JSONData]'}`;
});

export const logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), myFormat),
    transports: [
        new winston.transports.File({filename: './logs/error.log', level: 'error'}),
        new winston.transports.File({filename: './logs/combined.log', level: 'verbose'}),
    ],
});

if(process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: myConsoleFormat,
        level: 'info',
    }));
}
