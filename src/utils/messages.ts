import * as fs from 'fs-extra';

type Language = 'de_de' | 'en_gb';

type LocaleFile = {[commandName: string]: {[error: string]: string}}

const cachedLocales: {[K in Language]: LocaleFile} = {} as any;

const loadLocaleFile = async(language: Language): Promise<LocaleFile> => {
    if(language in cachedLocales) { return cachedLocales[language]; }
    const file = await fs.readJSON(`./resources/l10n/${language}.json`) as LocaleFile;
    cachedLocales[language] = file;
    return file;
};

const getMessageFromFile = (file: LocaleFile, command: string, message: string) => {
    return file[command][message];
};

export const getMessage = async(language: Language, command: string, message: string): Promise<string> => {
    return loadLocaleFile(language).then((file) => getMessageFromFile(file, command, message));
};

export const getAndFillMessage = (command: string, language: Language) => async(message: string, values?: {[key: string]: number | string}): Promise<string> => {
    const messageString = await getMessage(language, command, message);
    if(typeof values === 'undefined') { return messageString; }
    const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
    const text = messageString.replace(templateMatcher, (substring, value: string) => {
        value = `${values[value]}`;
        return value;
    });
    return text;
};
