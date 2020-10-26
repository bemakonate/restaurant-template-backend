export const validateHhMm = (value) => {
    var isValid = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(value);
    return isValid;
}

export const arrayEquals = (a, b) => {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}


export const validateBusinessHours = (businessHours) => {
    const isDayHoursValid = (dayHours) => {
        let isDayHoursValid = true;
        //If value is an array
        if (Array.isArray(dayHours)) {
            //make sure number of hours are even
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

    //For loop through each day of the week
    for (const dayIndex in businessHours) {
        const dayHours = businessHours[dayIndex];
        const dayHoursValid = isDayHoursValid(dayHours);
        dayHoursValidity.push(dayHoursValid);
    }

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