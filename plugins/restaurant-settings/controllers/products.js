const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    getProducts: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const { _pickUpTime } = ctx.query;

        //Get all products from plugin. Make sure we don't expose sensitive information
        const entity = await strapi.query("product", pluginId).find();
        const sanitizedProducts = sanitizeEntity(entity, { model: plugin.models.product });

        //Loop through each product and populate each product
        const populatedProducts = await Promise.all(sanitizedProducts.map(async (product) => {
            const newProduct = await plugin.services.populate.populatedSanitizedProduct({ id: product.id, pickUpTime: Number(_pickUpTime) });
            return newProduct;
        }))
        return populatedProducts

    },
    getProduct: async (ctx) => {
        const { id } = ctx.params;
        const { _pickUpTime } = ctx.query;
        const plugin = strapi.plugins[pluginId];

        //---------convert into middleware-------
        //If the product doesn't exist in the database return an error
        const entity = await strapi.query("product", pluginId).findOne({ id });
        if (!entity) {
            return ctx.throw(400, "The product doesn't exist")
        }
        //-------------------------

        const product = await plugin.services.populate.populatedSanitizedProduct({ id, pickUpTime: Number(_pickUpTime) });
        return product
    },
    updateProduct: async (ctx) => {
        const { id } = ctx.params;
        const { source, hours } = ctx.request.body;
        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();


        if (!source) {
            ctx.throw(400, "You need to pass product hours source")
        }



        //With the data recieved from admin get the working hours format and then update the product hours in the database
        newProductHours = await plugin.services['working-hours'].getWorkingHoursFormat({ source, hours, ctx });
        await pluginStore.set({ key: `products.${id}.hours`, value: newProductHours });

        //Send updated product back to user
        let sanitizedProduct = await plugin.services.populate.populatedSanitizedProduct({ id });

        return sanitizedProduct
    },
}