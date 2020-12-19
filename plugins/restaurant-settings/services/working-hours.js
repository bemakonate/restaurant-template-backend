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


const { isJson, validateHhMm, arrayEquals, msToHHMM, getDates } = require('./utils/helpers');
const { getWorkingTimePickupsInMs } = require('./utils/working-hours');
const moment = require('moment-business-time');
const pluginId = require("../admin/src/pluginId");

//Return the working hours in object format
const parsedWorkingHours = (workingHours) => {
    const defaultWorkingHoursVar = {
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null
    }


    return {
        ...workingHours,
        open: (isJson(workingHours.open) ? JSON.parse(workingHours.open) : workingHours.open) || defaultWorkingHoursVar,
        closed: isJson(workingHours.closed) ? JSON.parse(workingHours.closed) : workingHours.closed,
    }
}

//Return the working hours in json format
const jsonStrWorkingHours = (workingHours) => {
    return {
        ...workingHours,
        open: !isJson(workingHours.open) ? JSON.stringify(workingHours.open) : workingHours.open,
        closed: !isJson(workingHours.closed) ? JSON.stringify(workingHours.closed) : workingHours.closed,
    }
}

//Check if pick up time is valid for hours given
const isOpenForPickUp = ({ pickUpTime, hours }) => {
    if (isNaN(pickUpTime)) {
        return false;
    }

    //working hours need to be in object format
    const workingHours = parsedWorkingHours(hours);

    //1.define a moment locale for category hours
    const momentLocale = moment.updateLocale('en', {
        workinghours: workingHours.open,
        holidays: workingHours.closed,
    });



    //2.check to see if the category is available for pickupTime
    const pickUpNum = Number(pickUpTime)
    const momentPickUpTime = moment(pickUpNum);
    const isOpenForPickUp = momentPickUpTime.isWorkingTime();



    return isOpenForPickUp;
}

//return working hours format for api
const getWorkingHoursFormat = async ({ source, hours, ctx }) => {

    const plugin = strapi.plugins[pluginId];
    let newProductHours = null;


    switch (source) {
        case ('business'):
            newProductHours = { source: 'business', closed: null, open: null }
            break;
        case ('custom'):
            if (!hours || !hours.open || !hours.open) {
                ctx.throw(400, "Hours passed is not in correct format")
            }
            //validate if hours are valid
            const isHoursValid = plugin.services['working-hours'].validateWeeklyHours(hours.open);
            if (isHoursValid.error) {
                ctx.throw(400, "The hours for category is invalid")
            }

            newProductHours = { source: 'custom', open: hours.open, closed: hours.closed }
            break;
        case ('categories'):
            newProductHours = {
                source: 'categories',
                open: null,
                closed: null,
            }

            break;
        default:
            newProductHours = {
                source: 'none',
                open: null,
                closed: null,

            }

    }

    //Make sure to return working hours in json
    newProductHours = plugin.services['working-hours'].jsonStrWorkingHours(newProductHours);
    return newProductHours;
}

//Make sure weekly hours is valid 
const validateWeeklyHours = (businessHours) => {
    const isDayHoursValid = (dayHours) => {
        let isDayHoursValid = true;
        //If value is an array
        if (Array.isArray(dayHours)) {
            //make sure the number of times slots are even b/c we want each time slot to have a start and end
            if (dayHours.length % 2 !== 0) {
                isDayHoursValid = false;
            }
            //check to make sure each item in the array is a string and is not not empty
            dayHours.forEach(slotHour => {
                isDayHoursValid = isDayHoursValid && validateHhMm(slotHour);
            })
        }
        //If not an array
        else {
            //Make sure that the value is null
            isDayHoursValid = isDayHoursValid && (dayHours === null)
        }

        return isDayHoursValid;
    }
    //Make sure that their are seven days of the week (next line)
    //1. For in loop each object key and at it to an array
    const correctDaysOfTheWeek = [0, 1, 2, 3, 4, 5, 6];
    let givenDaysOfTheWeek = [];

    for (const dayIndex in businessHours) {
        givenDaysOfTheWeek.push(Number(dayIndex));
    }

    //2. Sort the array 
    givenDaysOfTheWeek = givenDaysOfTheWeek.sort((a, b) => a - b);
    //3. Make sure the given businessHours days array === [0,1,2,3,4,5,6]
    const isDaysOfWeekValid = arrayEquals(correctDaysOfTheWeek, givenDaysOfTheWeek);

    //4.If days of week not valid return error
    if (!isDaysOfWeekValid) {
        return {
            valid: false,
            error: {
                message: 'Days of the week are not correct'
            }
        }
    }

    const dayHoursValidity = [];

    //For loop through each day of the week and push if the day hours are valid
    for (const dayIndex in businessHours) {
        const dayHours = businessHours[dayIndex];
        const dayHoursValid = isDayHoursValid(dayHours);
        dayHoursValidity.push(dayHoursValid);
    }

    //Check if all day hours are valid
    let isAllHoursValid = true;
    dayHoursValidity.forEach(isDayHourValid => {
        isAllHoursValid = isAllHoursValid && isDayHourValid;
    })


    if (isAllHoursValid) {
        return {
            valid: true,
            error: null,
        }
    } else {
        return {
            valid: false,
            error: {
                message: 'One or more hours given is invalid'
            }
        }
    }

}


//Return the possible pickup slots user can get with the current time given
const currentPossiblePickups = ({ currentOrderingDateMs, maxOrderingDateMs, workingHours, minWaitingTime, pickupInterval }) => {
    const pickupDates = {};

    //Get the range of dates between current and max ordering date
    const datesBetween = getDates(new Date(currentOrderingDateMs), new Date(maxOrderingDateMs));

    //Will return the pick up time for the day: e.g { preOrderMins: 600000, pickupTime: 76800000 },
    const workingHoursPickupsInMs = getWorkingTimePickupsInMs({ workingHours, minWaitingTime, pickupInterval });

    datesBetween.forEach(date => {
        const dayIndex = moment(date).toDate().getDay();
        const dayPickupsConfig = workingHoursPickupsInMs[dayIndex];
        const dayStr = moment(date).format('YYYY-MM-DD');

        pickupDates[dayStr] = [];

        //Only if day of week is open or has open hours
        if (dayPickupsConfig) {
            //For each pick up time of day
            dayPickupsConfig.forEach(pickupInfo => {
                //We want to use the pickupTime given to get the specific date of the pick up
                const pickupDate = moment(`${dayStr} ${msToHHMM(pickupInfo.pickupTime)}`);

                const pickupDateMs = moment.duration(pickupDate).asMilliseconds();
                const preOrderDateMs = moment.duration(pickupDate).subtract(pickupInfo.preOrderMins, 'milliseconds').asMilliseconds();


                //Only add to possible pick ups if the current ordering date is before the pick up time expires and pick up date less than max ordering date
                if ((currentOrderingDateMs < preOrderDateMs) && (pickupDateMs < maxOrderingDateMs)) {
                    pickupDates[dayStr].push({
                        preOrderTime: preOrderDateMs,
                        pickUpTime: pickupDateMs,
                    })

                }
            })
        }
    })

    //If the pick ups in a day property is empty remove the day from open pickups
    for (const dateStr in pickupDates) {
        if (pickupDates[dateStr].length <= 0) {
            delete pickupDates[dateStr];
        }
    }
    return pickupDates;
}

//Only return pick ups within a single array
const getOnlyPickUps = (openPickUps) => {
    const allFuturePickUps = [];
    //Loop through each day config 
    for (const dayValue in openPickUps) {
        const dayOpenPickUps = openPickUps[dayValue];
        //If day has open pickups then push each of the pick up times to allFuturePickUps
        if (dayOpenPickUps.length > 0) {
            dayOpenPickUps.forEach(pickUpConfig => {
                allFuturePickUps.push(pickUpConfig);
            })
        }

    }
    return allFuturePickUps;
}



module.exports = { parsedWorkingHours, isOpenForPickUp, jsonStrWorkingHours, getWorkingHoursFormat, validateWeeklyHours, currentPossiblePickups, getOnlyPickUps }