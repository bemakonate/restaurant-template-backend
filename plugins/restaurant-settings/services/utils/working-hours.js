const moment = require('moment');
const { minsToMs } = require('./helpers');

//convert the workinghours to rows, so we can get the working time intervals
const toWorkingTimeSegements = (workingHours) => {
    const workingTimeSegments = {};

    //Loop through each day of the week in the working hours object
    for (const dayIndex in workingHours) {
        const dayConfig = workingHours[dayIndex];
        if (dayConfig) {
            //If the day has working hours then divided each consecutive pair of hours (e.g ['11:00' , '23:00']) to the new day config
            const dayConfigRows = [];
            for (let i = 0; i < dayConfig.length; i += 2) {
                const dayConfigRow = [...dayConfig].splice(i, 2);
                dayConfigRows.push(dayConfigRow);
            }
            workingTimeSegments[dayIndex] = dayConfigRows;

        } else {
            //If there is no working hours for that that
            workingTimeSegments[dayIndex] = null;
        }
    }
    return workingTimeSegments;
}

//with the workinghours in rows format, we should be able to get each possible pickup time for each day
const getWorkingTimePickupsInMs = ({ workingHours, minWaitingTime, pickupInterval }) => {
    const workingHoursPickups = {};

    //Get the working times in rows(having pairs of time slots)
    const workingTimeSegements = toWorkingTimeSegements(workingHours);

    //Loop through each day working hours
    for (const dayIndex in workingTimeSegements) {
        const dayConfigRows = workingTimeSegements[dayIndex];

        //If there the business is open for that day
        if (dayConfigRows) {
            const pickupsInMs = [];
            dayConfigRows.forEach(dayConfigRow => {
                //For each time slot we to get the slot starting and ending time (e.g ['11:00' , '23:00'])
                const openingTimeStart = dayConfigRow[0];
                const openingTimeEnd = dayConfigRow[1];

                const openingTimeStartMs = moment.duration(openingTimeStart).asMilliseconds();
                const openingTimeEndMs = moment.duration(openingTimeEnd).asMilliseconds();

                let currentPickupMs = openingTimeStartMs;

                //Continue this loop as long the current pick up time iteration is less than the last possible pick up time
                do {
                    //If the current iteration is still less than the max in millisecond, you can push the pickpTime to the array
                    if (currentPickupMs < openingTimeEndMs) {
                        pickupsInMs.push({
                            preOrderMins: minsToMs(minWaitingTime),
                            pickupTime: currentPickupMs
                        });
                    }
                    //For the next iteration create the pick up interval between pick up times that admin requested
                    currentPickupMs += minsToMs(pickupInterval);
                } while (currentPickupMs < openingTimeEndMs);
            })

            //Add the pick up times array we created the dayIndex/day of week
            workingHoursPickups[dayIndex] = pickupsInMs;

            //If the business is not open for that day
        } else {
            workingHoursPickups[dayIndex] = null;
        }
    }

    //Return all possible pick up times the user can choose from during the week
    return workingHoursPickups;

}

module.exports = { toWorkingTimeSegements, getWorkingTimePickupsInMs }