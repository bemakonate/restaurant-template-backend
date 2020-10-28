const pluginId = require("../../admin/src/pluginId");

module.exports = async (ctx, next) => {
    const { id } = ctx.params;
    // Add your own logic here.
    const entity = await strapi.query("category", pluginId).findOne({ id });
    if (!entity) {
        return ctx.throw(400, "The category doesn't exist");
    }
    return await next();

};
