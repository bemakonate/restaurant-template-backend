const moment = require('moment');
const msToHHMM = (ms) => {
    const obj = moment.duration(ms)._data;
    if (obj.hours < 10) {
        obj.hours = '0' + obj.hours;
    }
    if (obj.minutes < 10) {
        obj.minutes = '0' + obj.minutes;
    }
    return `${obj.hours}:${obj.minutes}`;
}

const minsToMs = (mins) => mins * 60000;


//convert the workinghours to rows, so we can get the working time intervals
const toWorkingTimeSegements = (workingHours) => {
    const workingTimeSegments = {};

    for (const dayIndex in workingHours) {
        const dayConfig = workingHours[dayIndex];
        if (dayConfig) {
            const dayConfigRows = [];
            for (let i = 0; i < dayConfig.length; i += 2) {
                const dayConfigRow = [...dayConfig].splice(i, 2);

                dayConfigRows.push(dayConfigRow);
            }
            workingTimeSegments[dayIndex] = dayConfigRows;

        } else {
            //push null for workingTimeSegments
            workingTimeSegments[dayIndex] = null;
        }
    }
    return workingTimeSegments;
}

//with the workinghours in rows format, we should be able to get each possible pickup time for each da
const getWorkingTimePickupsInMs = ({ workingHours, minWaitingTime, pickupInterval }) => {
    const workingHoursPickups = {};
    const workingTimeSegements = toWorkingTimeSegements(workingHours);
    for (const dayIndex in workingTimeSegements) {
        const dayConfigRows = workingTimeSegements[dayIndex];
        if (dayConfigRows) {
            const pickupsInMs = [];
            dayConfigRows.forEach(dayConfigRow => {
                //Loop to create default pickup times
                const openingTimeStart = dayConfigRow[0];
                const openingTimeEnd = dayConfigRow[1];

                const openingTimeStartMs = moment.duration(openingTimeStart).asMilliseconds();
                const openingTimeEndMs = moment.duration(openingTimeEnd).asMilliseconds();

                let currentPickupMs = openingTimeStartMs;

                do {
                    if (currentPickupMs < openingTimeEndMs) {
                        pickupsInMs.push({
                            preOrderMins: minsToMs(minWaitingTime),
                            pickupTime: currentPickupMs
                        });
                    }
                    currentPickupMs += minsToMs(pickupInterval);

                } while (currentPickupMs < openingTimeEndMs);
            })

            workingHoursPickups[dayIndex] = pickupsInMs;


        } else {
            //push null for day
            workingHoursPickups[dayIndex] = null;
        }
    }

    return workingHoursPickups;

}

//Get the dates/day between the two dates passed
var getDates = (startDate, endDate) => {
    const dates = [];
    let currentDate = startDate;

    do {
        dates.push(moment(currentDate).format('YYYY-MM-DD'));
        currentDate = new Date(new Date(currentDate).getTime() + 60000)

    } while (currentDate <= endDate);

    return Array.from(new Set(dates));
}

//Return the possible pickup slots user can get with the current time given
const currentPossiblePickups = ({ currentOrderingDateMs, maxOrderingDateMs, workingHours, minWaitingTime, pickupInterval }) => {
    const datesBetween = getDates(new Date(currentOrderingDateMs), new Date(maxOrderingDateMs));

    const pickupDates = {};
    const workingHoursPickupsInMs = getWorkingTimePickupsInMs({ workingHours, minWaitingTime, pickupInterval });

    datesBetween.forEach(date => {
        const dayIndex = moment(date).toDate().getDay();
        const dayPickupsConfig = workingHoursPickupsInMs[dayIndex];
        const dayStr = moment(date).format('YYYY-MM-DD');

        pickupDates[dayStr] = [];

        if (dayPickupsConfig) {
            dayPickupsConfig.forEach(pickupInfo => {
                const pickupDate = moment(`${dayStr} ${msToHHMM(pickupInfo.pickupTime)}`);
                const pickupDateMs = moment.duration(pickupDate).asMilliseconds();

                const preOrderDateMs = moment.duration(pickupDate).subtract(pickupInfo.preOrderMins, 'milliseconds').asMilliseconds();

                if (currentOrderingDateMs <= preOrderDateMs && pickupDateMs < maxOrderingDateMs) {
                    pickupDates[dayStr].push({
                        preOrderTime: preOrderDateMs,
                        pickUpTime: pickupDateMs,
                    })

                }
            })
        }
    })
    return pickupDates;
}

const getOnlyPickUps = (openPickUps) => {

    const allFuturePickUps = [];

    for (const dayValue in openPickUps) {
        const dayOpenPickUps = openPickUps[dayValue];
        dayOpenPickUps.forEach(pickUpConfig => {
            allFuturePickUps.push(pickUpConfig);
        })
    }
    return allFuturePickUps;
}

module.exports = {
    currentPossiblePickups,
    getOnlyPickUps,
}