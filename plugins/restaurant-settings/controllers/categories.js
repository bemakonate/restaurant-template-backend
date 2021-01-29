const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    getCategories: async (ctx) => {
        const query = ctx.query;
        const plugin = strapi.plugins[pluginId];

        //Get all categories from plugin. Make sure we don't expose sensitive information
        const entity = await strapi.query("category", pluginId).find();
        let sanitizedCategories = sanitizeEntity(entity, { model: plugin.models.category });

        //Loop through each category and populate the data
        sanitizedCategories = await Promise.all(sanitizedCategories.map(async (category) => {
            const populatedCategories = await plugin.services.populate.populatedSanitizedCategory({ id: category.id });
            return populatedCategories;

        }));

        return sanitizedCategories;
    },
    getCategory: async (ctx) => {
        const { id } = ctx.params;
        const query = ctx.query;
        const plugin = strapi.plugins[pluginId];

        //Get the populated category
        const sanitizedCategory = await plugin.services.populate.populatedSanitizedCategory({ id });

        return sanitizedCategory;
    },
}