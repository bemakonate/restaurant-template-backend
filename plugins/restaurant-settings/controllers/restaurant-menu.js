const pluginId = require("../admin/src/pluginId");
const axios = require("axios");
module.exports = {
    index: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const { data: categories } = await axios.get(`http://localhost:1337/${pluginId}/categories`);



    }

}