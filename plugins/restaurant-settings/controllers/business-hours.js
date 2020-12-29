const pluginId = require("../admin/src/pluginId");
const moment = require('moment-business-time');

//=================Business Data===================
// isAcceptingOrders (bool)
// pickUpVariables
//     earlyBookingMins (int)
//     pickUpInterval (int)
//     minWaitingTime (int)
//     userSelectionTime (int)
// hours
//     open (json)
//     closed (json)
// ordering
//     taxRate (int)
//     minimumPayment (int)




module.exports = {
    getBusinessData: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services.index.pluginFunctions();


        const business = await pluginStore.get({ key: 'business' });

        return {
            business: business || null,
        };

    },
    setBusinessData: async (ctx) => {
        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services.index.pluginFunctions;

        // 1.Get the new business data from req
        const { isAcceptingOrders, pickUpVariables, hours, ordering } = ctx.request.body;

        // 2.If there is a missing value return an error
        if (!pickUpVariables || !hours || !ordering) {
            return ctx.throw(400, "Not all values were givens")
        }
        // 3.Make sure all values submitted are valid
        //3a. make sure all of pickUpVariables values (earlyBookingMins,pickUpInterval, minWaitingTime,userSelectionTime) are valid


        const isPickUpVarsValid = Number.isInteger(Number(pickUpVariables.earlyBookingMins)) &&
            Number.isInteger(Number(pickUpVariables.pickUpInterval)) &&
            Number.isInteger(Number(pickUpVariables.minWaitingTime)) &&
            Number.isInteger(Number(pickUpVariables.userSelectionTime));

        if (!isPickUpVarsValid) {
            return ctx.throw(400, 'Pick Up variables passed is not valid');
        }

        //3b. make sure business hours are values (open, closed) are valid
        const isBusinessHoursValid = pluginFunctions('working-hours').validateWeeklyHours(hours.open);
        if (isBusinessHoursValid.error) {
            return ctx.throw(400, isBusinessHoursValid.error.message);
        }

        //3c. make sure all ordering data is valid
        const isOrderingValid = !isNaN(ordering.taxRate) && !isNaN(ordering.minimumPayment);
        if (!isOrderingValid) {
            return ctx.throw(400, "Ordering values passed is not valid");
        }


        // 4.All values should be in correct default format
        const businessData = { isAcceptingOrders, pickUpVariables, hours, ordering };

        businessData.hours.open = JSON.stringify(businessData.hours.open);
        businessData.hours.closed = JSON.stringify(businessData.hours.closed);
        // 5.Update the business data
        const result = await pluginStore.set({ key: 'business', value: businessData });


        ctx.send({ result });


    },
    getOpenPickUps: async (ctx) => {

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services.index.pluginFunctions;

        const businessData = await pluginStore.get({ key: 'business' });

        if (!businessData) {
            return ctx.throw(400, 'There are no business hours')
        }


        const pickUpInfo = businessData.pickUpVariables;
        const isAcceptingOrders = businessData.ordering.isAcceptingOrders;

        //Should be saved in plugin store and choosen by admin
        const maxMinsInAdvance = pickUpInfo.earlyBookingMins;
        const pickupInterval = pickUpInfo.pickUpInterval;
        const minWaitingTime = pickUpInfo.minWaitingTime;
        const userMinTimeToOrder = pickUpInfo.userSelectionTime;

        if (!maxMinsInAdvance || !userMinTimeToOrder) {
            return ctx.throw(400, "Pick Up varibales doesn't allow user to order")
        }


        //Get business hours
        const hours = businessData.hours;
        const workingHours = JSON.parse(hours.open);


        //Get the current time the user is trying to order and the max time the user is allowed to order in milliseconds
        const currentTime = moment().valueOf();
        let currentOrderingDate = moment.duration(currentTime).add(userMinTimeToOrder, 'minutes');
        let maxOrderingDate = moment.duration(currentTime).add(maxMinsInAdvance, 'minutes');


        let currentOrderingDateMs = currentOrderingDate._milliseconds;
        let maxOrderingDateMs = maxOrderingDate._milliseconds;

        //The function will return pick up times available for the user at current moment
        const openPickUps = pluginFunctions('working-hours').currentPossiblePickups({ currentOrderingDateMs, maxOrderingDateMs, workingHours, minWaitingTime, pickupInterval });



        //Only return pick up times if there are pick up times available
        return {
            openPickUps: (Object.keys(openPickUps).length > 0) && isAcceptingOrders ? openPickUps : null,
            isAcceptingOrders,
        };

    },
    getIsPickUpTimeValid: async (ctx) => {
        const { _pickUpTime } = ctx.query;

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();
        const pluginFunctions = plugin.services;


        if (!_pickUpTime) {
            ctx.throw(400, "You must pass _pickUpTime as a query")
        }

        const businessData = await pluginStore.get({ key: 'business' });
        if (!businessData) {
            return ctx.throw(400, 'There are no business hours')
        }

        const businessHours = businessData.hours;
        const pickUpInfo = businessData.pickUpVariables;
        const isAcceptingOrders = businessData.ordering.isAcceptingOrders;
        //Should be saved in plugin store and choosen by admin
        const maxMinsInAdvance = pickUpInfo.earlyBookingMins;
        const minWaitingTime = pickUpInfo.minWaitingTime;



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
        const isPickUpValid = pluginFunctions['working-hours'].isOpenForPickUp({ hours: businessHours, pickUpTime: _pickUpTime, isAcceptingOrders });


        //pickUpExpiringTime is before the waiting time needed to create product for pick up (milliseconds)
        const pickUpExpiringTime = pickUpTime - (minWaitingTime * 60000);

        //to be valid the product needs to be within pick up selection range and within business hours
        const isValid = isWithinReservation && isPickUpValid;

        return {
            isValid,
            pickUpTime,
            pickUpExpiringTime,
            isAcceptingOrders,

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

    },

}