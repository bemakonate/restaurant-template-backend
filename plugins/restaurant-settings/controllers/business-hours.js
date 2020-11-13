const pluginId = require("../admin/src/pluginId");
const moment = require('moment-business-time');

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
    getOpenPickUps: async (ctx) => {

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.functions.pluginStore();

        const currentTime = moment();
        const maxMinsInAdvance = 60 * 3;
        const pickupInterval = 20;
        const minWaitingTime = 10;
        const userMinTimeToOrder = 8;


        //Create logic
        const hours = await pluginStore.get({ key: 'businessHours' });

        const momentLocale = moment.updateLocale('en', {
            workinghours: hours.open || plugin.services.function.defaultWorkingHours(),
            holidays: hours.closed,
        });


        const workingHours = momentLocale._config.workinghours;

        let currentOrderingDate = moment.duration(currentTime).add(userMinTimeToOrder, 'minutes');
        let maxOrderingDate = moment.duration(currentOrderingDate).add(maxMinsInAdvance, 'minutes');


        let currentOrderingDateMs = currentOrderingDate._milliseconds;
        let maxOrderingDateMs = maxOrderingDate._milliseconds;

        const openPickUps = plugin.services.functions.currentPossiblePickups({ currentOrderingDateMs, maxOrderingDateMs, workingHours, minWaitingTime, pickupInterval });


        return openPickUps;
    },
    getIsPickUpTimeValid: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const { _pickUpTime } = ctx.query;

        if (!_pickUpTime) {
            ctx.throw(400, "You must pass _pickUpTime as a query")
        }

        const openPickUps = await plugin.controllers['business-hours'].getOpenPickUps(ctx);
        const allFuturePickUps = plugin.services.functions.getOnlyPickUps(openPickUps);
        const foundPickUpTime = allFuturePickUps.find(pickUpConfig => pickUpConfig.pickUpTime === Number(_pickUpTime))

        return {
            isValid: foundPickUpTime ? true : false,
            foundPickUpTime
        }
    },
    getNextOpenPickUp: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const openPickUps = await plugin.controllers['business-hours'].getOpenPickUps(ctx);
        const allFuturePickUps = plugin.services.functions.getOnlyPickUps(openPickUps);

        return allFuturePickUps.length > 0 ? allFuturePickUps[0] : null;

    }
}