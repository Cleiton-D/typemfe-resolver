module.exports = function({typescript}) {
  return {
    create(info) {
      const resolveModuleNames = info.languageServiceHost.resolveModuleNames.bind(info.languageServiceHost);

      info.languageServiceHost.resolveModuleNames = function (moduleNames, containingFile, reusedNames, redirectedReferences, options) {
        console.log("modules", moduleNames);
        return resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReferences, options);
      }

      return info.languageService;
    }
  }
}