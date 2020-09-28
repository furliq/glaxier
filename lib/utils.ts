import fs from 'fs';
import path from 'path';

export interface Settable {
    set(value: any);
}

export interface Valuable {
    value: any;
}

export class Utils {
    static readonly stagingFile = path.resolve(__dirname, '..', 'dist', 'stage.html');
    private static readonly defaultDirs = ['dist', 'dist/scenes'];
    private static readonly registeredDirs = [];

    static load(filePath) {
        try {
            const exports = eval(`require('${filePath}')`);
            return exports;
        }
        catch (e) {
            console.error(e);
            return {};
        }
    }

    static stage(html) {
        fs.writeFileSync(this.stagingFile, html);
    }

    static registerPath(path) {
        this.registeredDirs.push(path);
    }

    static lookup(file) {
        const dirs = [...this.registeredDirs, ...this.defaultDirs];
        for (const dir of dirs) {
            const pathname = path.resolve(dir, file);
            if (fs.existsSync(pathname)) {
                const relativePath =  './' + path.relative(path.resolve(__dirname, '../dist'), pathname).replace(/\b\\\b/g, '/'); // for module type script tags
                const moduleImport = relativePath.replace(/\.js$/, ''); // for require
                const scriptSrc = relativePath.replace(/^\.\//, ''); // for non module script tags
                return { relativePath, moduleImport, scriptSrc };
            }
        }
        return {};
    }
}

export class ObjectParser {
    static parse(value) {
        return JSON.parse(JSON.stringify(value, ObjectParser.stringifyReplacer(value)));
    }

    private static stringifyReplacer(toBeStringified: any): any {
        const refMap = new Map<any, number>();
        let serializedObjectCounter = 0;
        return function (key: any, value: any) {
            if (serializedObjectCounter !== 0 && typeof (toBeStringified) === 'object' && toBeStringified === value) {
                // console.error(`object serialization with key ${key} has circular reference to being stringified object`);
                return Symbol(key);
            }

            serializedObjectCounter++;

            const isObject = typeof (value) === 'object'

            if (refMap.has(value)) {
                return ObjectParser.parse(value);
            }
            else if (isObject) {
                refMap.set(value, serializedObjectCounter);
            }
            return value;
        }
    }
}