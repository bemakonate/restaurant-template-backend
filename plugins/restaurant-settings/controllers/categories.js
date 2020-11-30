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
            const populatedCategories = await plugin.services.populate.populatedSanitizedCategory({
                id: category.id,
                pickUpTime: Number(query._pickUpTime),
            });
            return populatedCategories;

        }));

        return sanitizedCategories;
    },
    getCategory: async (ctx) => {
        const { id } = ctx.params;
        const query = ctx.query;
        const plugin = strapi.plugins[pluginId];

        //Get the populated category
        const sanitizedCategory = await plugin.services.populate.populatedSanitizedCategory({
            id,
            pickUpTime: Number(query._pickUpTime),
        })

        return sanitizedCategory;
    },
    updateCategory: async (ctx) => {
        const { id } = ctx.params;
        const { source, hours } = ctx.request.body;
        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services.index.pluginFunctions;


        if (!source) {
            ctx.throw(400, "You need to pass business hours source")
        }

        //Get the proper working hours format to save data to database and then save the data to db
        let newCategoryHours = await pluginFunctions('working-hours').getWorkingHoursFormat({ source, hours, ctx });
        await pluginStore.set({ key: `categories.${id}.hours`, value: newCategoryHours });

        //Return the updated category
        let sanitizedCategory = await pluginFunctions('populate').populatedSanitizedCategory({ id })

        return sanitizedCategory
    },
}