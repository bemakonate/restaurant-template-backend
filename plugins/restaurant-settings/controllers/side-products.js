const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    getSideProducts: async (ctx) => {
        const plugin = strapi.plugins[pluginId];

        //Get all side products from plugin. Make sure we don't expose sensitive information
        const entity = await strapi.query("side-product", pluginId).find();
        let sanitizedEntity = sanitizeEntity(entity, { model: plugin.models['side-product'] });

        //Loop through each side product and populate each side product
        sanitizedEntity = await Promise.all(sanitizedEntity.map(async (sideProduct) => {
            const newSideProduct = await plugin.services.populate.populatedSanitizedSideProduct({ id: sideProduct.id });
            return newSideProduct;

        }));

        return sanitizedEntity;

    },
    getSideProduct: async (ctx) => {
        const { id } = ctx.params;
        const plugin = strapi.plugins[pluginId];
        //---------convert into middleware-------
        const entity = await strapi.query("side-product", pluginId).findOne({ id });
        if (!entity) {
            return ctx.throw(400, "The side product doesn't exist")
        }
        //-------------------------

        const sanitizedSideProduct = plugin.services.populate.populatedSanitizedSideProduct({ id });
        return sanitizedSideProduct;
    },
}