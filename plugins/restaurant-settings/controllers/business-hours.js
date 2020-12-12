const pluginId = require("../admin/src/pluginId");
const moment = require('moment-business-time');

//======== WORKING HOURS EXAMPLE ==========
//  {
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
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services.index.pluginFunctions();

        const businessHours = await pluginStore.get({ key: 'businessHours' });


        //We want to return the business hours in json format b/c of graphql 
        return {
            source: 'custom',
            open: businessHours ? businessHours.open : JSON.stringify(pluginFunctions.defaultWorkingHours()),
            closed: businessHours ? businessHours.closed : JSON.stringify(null),
        };

    },
    updateBusinessHours: async (ctx) => {
        let { open: openHours, closed: closedHours } = ctx.request.body;

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services.index.pluginFunctions;


        if (!openHours) {
            return ctx.throw(400, "Please provide the business hours")
        }

        //Will make sure that open hours returned is in a valid syntax
        const isBusinessHoursValid = pluginFunctions('working-hours').validateWeeklyHours(openHours);
        if (isBusinessHoursValid.error) {
            return ctx.throw(400, isBusinessHoursValid.error.message);
        }


        //Make sure all business hours are saved in json format
        openHours = JSON.stringify(openHours);
        closedHours = JSON.stringify(closedHours);


        const result = await pluginStore.set({ key: 'businessHours', value: { open: openHours, closed: closedHours } });
        ctx.send({ result });
    },
    getOpenPickUps: async (ctx) => {

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services.index.pluginFunctions;

        //Should be saved in plugin store and choosen by admin
        const maxMinsInAdvance = 60 * 3;
        const pickupInterval = 20;
        const minWaitingTime = 10;
        const userMinTimeToOrder = 8;


        //Get business hours
        const hours = await pluginStore.get({ key: 'businessHours' });
        const workingHours = JSON.parse(hours.open);


        //Get the current time the user is trying to order and the max time the user is allowed to order in milliseconds
        const currentTime = moment();
        let currentOrderingDate = moment.duration(currentTime).add(userMinTimeToOrder, 'minutes');
        let maxOrderingDate = moment.duration(currentOrderingDate).add(maxMinsInAdvance, 'minutes');


        let currentOrderingDateMs = currentOrderingDate._milliseconds;
        let maxOrderingDateMs = maxOrderingDate._milliseconds;

        //The function will return pick up times available for the user at current moment
        const openPickUps = pluginFunctions('working-hours').currentPossiblePickups({ currentOrderingDateMs, maxOrderingDateMs, workingHours, minWaitingTime, pickupInterval });


        //Only return pick up times if there are pick up times available
        return {
            openPickUps: Object.keys(openPickUps).length > 0 ? openPickUps : null,
        };

    },
    getIsPickUpTimeValid: async (ctx) => {
        const { _pickUpTime } = ctx.query;

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services;

        let businessHours = await pluginStore.get({ key: 'businessHours' });

        if (!_pickUpTime) {
            ctx.throw(400, "You must pass _pickUpTime as a query")
        }

        //Should be saved in plugin store and choosen by admin
        const maxMinsInAdvance = 60 * 3;
        const minWaitingTime = 10;


        //Get the current time the user is trying to order and the max time the user is allowed to order in milliseconds
        const pickUpTime = Number(_pickUpTime);
        const currentDateMs = new Date().getTime()
        const maxOrderingDateMs = currentDateMs + (maxMinsInAdvance * 60000);


        //isWithinReservation calculate if user pickUpTime is in the valid range of choosing pickUpTime
        let isWithinReservation = false;

        if ((currentDateMs < pickUpTime) && (pickUpTime < maxOrderingDateMs)) {
            isWithinReservation = true;
        }

        //isPickUpValid will check to see the business is open during pickUpTime
        const isPickUpValid = pluginFunctions['working-hours'].isOpenForPickUp({ hours: businessHours, pickUpTime: _pickUpTime });


        //pickUpExpiringTime is before the waiting time needed to create product for pick up (milliseconds)
        const pickUpExpiringTime = pickUpTime - (minWaitingTime * 60000);

        //to be valid the product needs to be within pick up selection range and within business hours
        const isValid = isWithinReservation && isPickUpValid;

        return {
            isValid,
            pickUpTime,
            pickUpExpiringTime,

        }
    },
    getNextOpenPickUp: async (ctx) => {
        const plugin = strapi.plugins[pluginId];

        //Get the current available pickup times from the getOpenPickUps controller
        const { openPickUps } = await plugin.controllers['business-hours'].getOpenPickUps(ctx);

        //We want to get only a single array of all pickups
        const allFuturePickUps = plugin.services['working-hours'].getOnlyPickUps(openPickUps);

        //Return the next upcoming pick up within the array
        return {
            nextPickUp: allFuturePickUps.length > 0 ? allFuturePickUps[0] : null,
        };

    }
}