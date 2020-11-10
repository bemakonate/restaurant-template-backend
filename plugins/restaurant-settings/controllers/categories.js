const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    getCategories: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const entity = await strapi.query("category", pluginId).find();
        const query = ctx.query;

        let sanitizedTimedCategories = sanitizeEntity(entity, { model: plugin.models.category });

        sanitizedTimedCategories = await Promise.all(sanitizedTimedCategories.map(async (timedCategory) => {
            const updatedCategoryHour = await plugin.services.functions.populatedSanitizedCategory({
                id: timedCategory.id,
                pickUpTime: Number(query.pickUpTime),
            });
            return updatedCategoryHour;

        }));

        return sanitizedTimedCategories
    },
    getCategory: async (ctx) => {
        const { id } = ctx.params;
        const query = ctx.query;
        const plugin = strapi.plugins[pluginId];

        const sanitizedTimedCategory = await plugin.services.functions.populatedSanitizedCategory({
            id,
            pickUpTime: Number(query.pickUpTime),
        })

        return sanitizedTimedCategory
    },
    updateCategory: async (ctx) => {
        const { id } = ctx.params;
        const { source, hours } = ctx.request.body;
        const plugin = strapi.plugins[pluginId];


        if (!source) {
            ctx.throw(400, "You need to pass business hours source")
        }
        const entity = await strapi.query("category", pluginId).findOne({ id });

        const pluginStore = plugin.services.functions.pluginStore();
        let newCategoryHours = null;



        switch (source) {
            case ('business'):
                newCategoryHours = { source: 'business', hours: null }
                break;
            case ('custom'):
                //validate if hours are valid
                const isHoursValid = plugin.services.functions.validateWeeklyHours(hours);
                if (isHoursValid.error) {
                    ctx.throw(400, "The hours for category is invalid")
                }
                newCategoryHours = { source: 'custom', hours: hours }
                break;
            default:
                newCategoryHours = { source: 'none', hours: null }

        }

        const result = await pluginStore.set({ key: `categories.${id}.hours`, value: newCategoryHours });


        let sanitizedCategory = sanitizeEntity(entity, { model: plugin.models.category });
        sanitizedCategory = await plugin.services.functions.addCategoryHours(sanitizedCategory);


        return sanitizedCategory
    },
}