import * as fs from 'fs-extra';
import {logger} from './logging';

type Language = 'de_de' | 'en_gb';

export type LocaleFile = {[error: string]: string}
export type LocaleObj = {[error: string]: (values?: {[key: string]: number | string}) => string}

const cachedLocales: {[K in Language]: LocaleFile} = {} as any;

const loadLocaleFile = async(language: Language): Promise<LocaleFile> => {
    if(language in cachedLocales) { return cachedLocales[language]; }
    const file = await fs.readJSON(`./resources/l10n/${language}.json`) as LocaleFile;
    cachedLocales[language] = file;
    return file;
};

export const messages = async(language: Language): Promise<LocaleObj> => {
    const file = await loadLocaleFile(language);
    const msgObj: LocaleObj = {};
    for(const key in file) {
        logger.verbose(`🚀 ~ file: messages.ts ~ line 21 ~ messages ~ key`, key);
        msgObj[key] = (values?: {[key: string]: number | string}) => {
            if(typeof values === 'undefined') { return file[key]; }
            const templateMatcher = /{{\s?([^{}\s]*)\s?}}/g;
            const text = file[key].replace(templateMatcher, (substring, value: string) => {
                value = `${values[value]}`;
                return value;
            });
            return text;
        };
    }
    return msgObj;
};
