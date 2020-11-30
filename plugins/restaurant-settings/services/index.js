const pluginId = require("../admin/src/pluginId");
module.exports = {
    pluginFunctions: (fileName = 'functions') => {
        const plugin = strapi.plugins[pluginId];
        return plugin.services[fileName]
    },
    pluginStore: () => strapi.store({
        environment: strapi.config.environment,
        type: 'plugin',
        name: 'bemak-restaurant-settings'
    })
}