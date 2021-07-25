const { dirname } = require("path");

function patchCreateProgram(tsm, forceReadConfig = false, projectDir = process.cwd()) {
    const originCreateProgram = tsm.createProgram;

    function createProgram(
        rootNamesOrOptions,
        options,
        host,
        oldProgram,
        configFileParsingDiagnostics
    ) {
        let rootNames;
        let createOpts;
        if (!Array.isArray(rootNamesOrOptions)) {
            createOpts = rootNamesOrOptions;
        }
        if (createOpts) {
            rootNames = createOpts.rootNames;
            options = createOpts.options;
            host = createOpts.host;
            oldProgram = createOpts.oldProgram;
            configFileParsingDiagnostics = createOpts.configFileParsingDiagnostics;
        } else {
            options = options;
            rootNames = rootNamesOrOptions;
        }

        if (forceReadConfig) {
            const info = getConfig(tsm, options, rootNames, projectDir);
            options = info.compilerOptions;
            if (createOpts) {
                createOpts.options = options;
            }
            projectDir = info.projectDir;
        }

        console.log("passou por aqui fiao");
        const program = createOpts
            ? originCreateProgram(createOpts)
            : originCreateProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics);


        const originEmit = program.emit;
        program.emit = function newEmit(
            ...args
        ) {
          return originEmit(...args);
        };
        return program;
    }
    tsm.createProgram = createProgram;
    return tsm;
}

function getConfig(
    tsm,
    compilerOptions,
    rootFileNames,
    defaultDir
) {
    if (compilerOptions.configFilePath === undefined) {
        const dir = rootFileNames.length > 0 ? dirname(rootFileNames[0]) : defaultDir;
        const tsconfigPath = tsm.findConfigFile(dir, tsm.sys.fileExists);
        if (tsconfigPath) {
            const projectDir = dirname(tsconfigPath);
            const config = readConfig(tsm, tsconfigPath, dirname(tsconfigPath));
            compilerOptions = { ...config.options, ...compilerOptions };
            return {
                projectDir,
                compilerOptions,
            };
        }
    }
    return {
        projectDir: dirname(compilerOptions.configFilePath),
        compilerOptions,
    };
}

function readConfig(tsm, configFileNamePath, projectDir) {
    const result = tsm.readConfigFile(configFileNamePath, tsm.sys.readFile);
    if (result.error) {
        throw new Error('tsconfig.json error: ' + result.error.messageText);
    }
    return tsm.parseJsonConfigFileContent(result.config, tsm.sys, projectDir, undefined, configFileNamePath);
}

module.exports = {patchCreateProgram}