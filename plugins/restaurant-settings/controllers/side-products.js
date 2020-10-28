const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    getSideProducts: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const entity = await strapi.query("side-product", pluginId).find();
        let sanitizedEntity = sanitizeEntity(entity, { model: plugin.models['side-product'] });

        sanitizedEntity = await Promise.all(sanitizedEntity.map(async (sideProduct) => {
            const newSideProduct = await plugin.services.functions.populatedSanitizedSideProduct(sideProduct.id);
            return newSideProduct;

        }));

        return sanitizedEntity;

    },
    getSideProduct: async (ctx) => {
        const { id } = ctx.params;
        //---------convert into middleware-------
        const entity = await strapi.query("side-product", pluginId).findOne({ id });
        if (!entity) {
            return ctx.throw(400, "The side product doesn't exist")
        }
        //-------------------------

        const plugin = strapi.plugins[pluginId];
        const sanitizedProduct = plugin.services.functions.populatedSanitizedSideProduct(id);

        return sanitizedProduct;

    },
}