const {readFileSync} = require("fs")
const {sync: resolveSync} = require("resolve");
const {dirname} = require("path");
const {runInThisContext} = require("vm")

const Module = require('module');
const {patchCreateProgram} = require("./patchCreateProgram")

function loadTypeScript(
    filename,
    { folder = __dirname, forceConfigLoad = false } = {}
) {
    const libFilename = resolveSync('typescript/lib/' + filename, { basedir: folder });

    if (!(libFilename in require.cache)) {
        require.cache[libFilename] = new TypeScriptModule(libFilename);
    }

    const ts = new TypeScriptModule(libFilename).exports;

    const [major, minor] = ts.versionMajorMinor.split('.');
    if (+major < 3 && +minor < 7) {
        throw new Error('ttypescript supports typescript from 2.7 version');
    }

    return patchCreateProgram(ts, forceConfigLoad);
}

const typeScriptFactoryCache = new Map();

class TypeScriptModule extends Module {
    paths = module.paths.slice();
    loaded = true;
    _exports = undefined;

    constructor(filename) {
        super(filename, module);
    }

    get exports() {
        return this._exports || this._init();
    }

    set exports(value) {
        this._exports = value;
    }

    _init() {
        this._exports = {};
        let factory = typeScriptFactoryCache.get(this.filename);
        if (!factory) {
            const code = readFileSync(this.filename, 'utf8');
            factory = runInThisContext(`(function (exports, require, module, __filename, __dirname) {${code}\n});`, {
                filename: this.filename,
                lineOffset: 0,
                displayErrors: true,
            });
            typeScriptFactoryCache.set(this.filename, factory);
        }
        factory.call(this._exports, this._exports, require, this, this.filename, dirname(this.filename));
        return this._exports;
    }
}

module.exports = {loadTypeScript}