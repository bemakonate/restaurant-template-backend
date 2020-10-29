const pluginId = require("../admin/src/pluginId");

// const businessHours = {
//   5: null,
//   6: null,
//   2: null,
//   3: null,
//   0: ['06:30:00', '12:00:00', '13:30:00', '17:00:00'],
//   1: ['09:30:00', '17:00:00'],
//   4: ['06:30:00', '12:00:00', '13:30:00', '17:00:00'],
// };
module.exports = {
    getBusinessHours: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.functions.pluginStore();

        const businessHours = await pluginStore.get({ key: 'businessHours' });
        // Send 200 `ok`

        return {
            open: JSON.stringify(businessHours.open || null),
            closed: businessHours.closed || null,
        };

    },
    updateBusinessHours: async (ctx) => {
        const { open: openHours, closed: closedHours } = ctx.request.body;

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.functions.pluginStore();


        if (!openHours) {
            return ctx.throw(400, "Please provide the business hours")
        }

        const isBusinessHoursValid = plugin.services.functions.validateWeeklyHours(openHours);
        if (isBusinessHoursValid.error) {
            return ctx.throw(400, isBusinessHoursValid.error.message);
        }

        const result = await pluginStore.set({ key: 'businessHours', value: { open: openHours, closed: closedHours } });

        ctx.send({ result });
    },
}