const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    getProducts: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const entity = await strapi.query("product", pluginId).find();
        const sanitizedProducts = sanitizeEntity(entity, { model: plugin.models.product });

        //Loop through each product
        const populatedProducts = await Promise.all(sanitizedProducts.map(async (product) => {
            const newProduct = await plugin.services.functions.populatedSanitizedProduct({ id: product.id });
            return newProduct;
        }))
        return populatedProducts

    },
    getProduct: async (ctx) => {
        const { id } = ctx.params;
        const { _pickUpTime } = ctx.query;
        const plugin = strapi.plugins[pluginId];



        //---------convert into middleware-------
        const entity = await strapi.query("product", pluginId).findOne({ id });
        if (!entity) {
            return ctx.throw(400, "The product doesn't exist")
        }
        //-------------------------
        const product = await plugin.services.functions.populatedSanitizedProduct({ id, pickUpTime: Number(_pickUpTime) });
        return product
    },
    updateProduct: async (ctx) => {
        const { id } = ctx.params;
        const { _pickUpTime } = ctx.query;
        const { source, hours } = ctx.request.body;
        const plugin = strapi.plugins[pluginId];



        if (!source) {
            ctx.throw(400, "You need to pass product hours source")
        }

        const entity = await strapi.query("product", pluginId).findOne({ id });

        const pluginStore = plugin.services.functions.pluginStore();
        let newProductHours = null;




        switch (source) {
            case ('business'):
                newProductHours = { source: 'business', hours: null }
                break;
            case ('custom'):
                //validate if hours are valid
                const isHoursValid = plugin.services.functions.validateWeeklyHours(hours);
                if (isHoursValid.error) {
                    ctx.throw(400, "The hours for category is invalid")
                }
                newProductHours = { source: 'custom', hours: hours }
                break;
            case ('categories'):
                newProductHours = { source: 'categories', hours: null }
                break;
            default:
                newProductHours = { source: 'none', hours: null }

        }

        const result = await pluginStore.set({ key: `products.${id}.hours`, value: newProductHours });

        let sanitizedProducts = await plugin.services.functions.populatedSanitizedProduct({
            id,
            pickUpTime: Number(_pickUpTime)
        });


        return sanitizedProducts
    },
}