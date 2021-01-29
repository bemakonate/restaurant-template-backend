const pluginId = require("../admin/src/pluginId");
const moment = require('moment-business-time');

//=================Business Data===================

// hours
//     open (json)
//     closed (json)


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
        const { hours } = ctx.request.body;

        // 2.If there is a missing value return an error
        if (!hours) {
            return ctx.throw(400, "Not all values were givens")
        }
        // 3.Make sure all values submitted are valid


        //3b. make sure business hours are values (open, closed) are valid
        const isBusinessHoursValid = pluginFunctions('working-hours').validateWeeklyHours(hours.open);
        if (isBusinessHoursValid.error) {
            return ctx.throw(400, isBusinessHoursValid.error.message);
        }


        // 4.All values should be in correct default format
        const businessData = { hours };
        businessData.hours.open = JSON.stringify(businessData.hours.open);
        businessData.hours.closed = JSON.stringify(businessData.hours.closed);

        // 5.Update the business data
        const result = await pluginStore.set({ key: 'business', value: businessData });


        ctx.send({ result });


    },



}