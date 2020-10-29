'use strict';
const pluginId = require("../admin/src/pluginId");

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

  setSecrets: async (ctx) => {
    const plugin = strapi.plugins[pluginId];
    const pluginStore = plugin.services.functions.pluginStore();


    const { stripePKSecret, orderIdSecret } = ctx.request.body;

    if (!stripePKSecret || !orderIdSecret) {
      return ctx.throw(400, "Please provide a private key")
    }

    const result = await pluginStore.set({ key: 'secrets', value: { stripePKSecret, orderIdSecret } })
    ctx.send({ result });
  },
  getSecrets: async (ctx) => {
    const plugin = strapi.plugins[pluginId];
    const pluginStore = plugin.services.functions.pluginStore();

    const secrets = await pluginStore.get({ key: 'secrets' });
    ctx.send({
      secrets: secrets ? secrets : ''
    })

  }


};
