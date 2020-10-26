'use strict';

const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');
/**
 * restaurant-settings.js controller
 *
 * @description: A set of functions called "actions" of the `restaurant-settings` plugin.
 */

module.exports = {

  /**
   * Default action.
   *
   * @return {Object}
   */

  getBusinessHours: async (ctx) => {
    const plugin = strapi.plugins['restaurant-settings'];
    const pluginStore = plugin.services.functions.pluginStore();



    const businessHours = await pluginStore.get({ key: 'businessHours' });
    // Send 200 `ok`

    const result = businessHours ? JSON.stringify(businessHours) : '';
    return result;

  },
  updateBusinessHours: async (ctx) => {
    const { user } = ctx.state;
    const { businessHours } = ctx.request.body;
    // const businessHours = {
    //   5: null,
    //   6: null,
    //   2: null,
    //   3: null,
    //   0: ['06:30:00', '12:00:00', '13:30:00', '17:00:00'],
    //   1: ['09:30:00', '17:00:00'],
    //   4: ['06:30:00', '12:00:00', '13:30:00', '17:00:00'],
    // };

    const plugin = strapi.plugins['restaurant-settings'];
    const pluginStore = plugin.services.functions.pluginStore();

    const foundAdminUser = user.roles.find(role => role.id == 1);

    //Ensure user is admin
    if (!foundAdminUser) {
      return ctx.unauthorized("Only admin allowed")
    }

    if (!businessHours) {
      return ctx.throw(400, "Please provide the business hours")
    }

    const isBusinessHoursValid = plugin.services.functions.validateWeeklyHours(businessHours);
    if (isBusinessHoursValid.error) {
      return ctx.throw(400, isBusinessHoursValid.error.message);
    }

    const result = await pluginStore.set({ key: 'businessHours', value: businessHours });

    ctx.send({ result });
  },
  getCategories: async (ctx) => {
    const plugin = strapi.plugins[pluginId];
    const entity = await strapi.query("category", pluginId).find();

    let sanitizedTimedCategories = sanitizeEntity(entity, { model: plugin.models.category });

    sanitizedTimedCategories = await Promise.all(sanitizedTimedCategories.map(async (timedCategory) => {
      const updatedCategoryHour = await plugin.services.functions.populatedSanitizedCategory(timedCategory.id);
      return updatedCategoryHour;

    }));

    return sanitizedTimedCategories
  },
  getCategory: async (ctx) => {
    const { id } = ctx.params;

    const plugin = strapi.plugins[pluginId];
    //---------convert into middleware-------
    const entity = await strapi.query("category", pluginId).findOne({ id });
    if (!entity) {
      return ctx.throw(400, "The timed category doesn't exist")
    }
    //-------------------------
    let sanitizedTimedCategory = sanitizeEntity(entity, { model: plugin.models.category });
    sanitizedTimedCategory = await plugin.services.functions.addCategoryHours(sanitizedTimedCategory);


    return sanitizedTimedCategory
  },
  updateCategory: async (ctx) => {
    const { id } = ctx.params;
    const { sourcedHoursFrom, hours } = ctx.request.body;

    const plugin = strapi.plugins[pluginId];
    const pluginStore = plugin.services.functions.pluginStore();

    //---------convert into middleware-------
    const entity = await strapi.query("category", pluginId).findOne({ id });
    if (!entity) {
      return ctx.throw(400, "The timed category doesn't exist")
    }
    //-------------------------

    let newCategoryHours = null;

    switch (sourcedHoursFrom) {
      case ('business'):
        newCategoryHours = { sourcedHoursFrom: 'business', hours: null }
        break;
      case ('custom'):
        //validate if hours are valid
        const isHoursValid = plugin.services.functions.validateWeeklyHours(hours);
        if (isHoursValid.error) {
          ctx.throw(400, "The hours for category is invalid")
        }
        newCategoryHours = { sourcedHoursFrom: 'custom', hours: hours }
        break;
      default:
        newCategoryHours = { sourcedHoursFrom: null, hours: null }

    }

    const result = await pluginStore.set({ key: `categories.${id}.hours`, value: newCategoryHours });


    let sanitizedCategory = sanitizeEntity(entity, { model: plugin.models.category });
    sanitizedCategory = await plugin.services.functions.addCategoryHours(sanitizedCategory);


    return sanitizedCategory
  },
  getProducts: async (ctx) => {
    const plugin = strapi.plugins[pluginId];
    const entity = await strapi.query("product", pluginId).find();
    const sanitizedProducts = sanitizeEntity(entity, { model: plugin.models.product });

    //Loop through each product
    const populatedProducts = await Promise.all(sanitizedProducts.map(async (product) => {
      const newProduct = await plugin.services.functions.populatedSanitizedProduct(product.id);
      return newProduct;
    }))
    return populatedProducts

  },
  getProduct: async (ctx) => {
    const { id } = ctx.params;
    const plugin = strapi.plugins[pluginId];

    //---------convert into middleware-------
    const entity = await strapi.query("product", pluginId).findOne({ id });
    if (!entity) {
      return ctx.throw(400, "The product doesn't exist")
    }
    //-------------------------
    const product = await plugin.services.functions.populatedSanitizedProduct(entity.id);
    return product
  },
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

  }
};
