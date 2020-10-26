export { validateBusinessHours } from './helpers/validateMomentBusinessHours';

//Frontend version
export const isWeeklyHoursValid = ({ weeklyHours, daysOpen }) => {
    let allInputsValid = true;
    for (const dayIndex in weeklyHours) {
        if (daysOpen.includes(Number(dayIndex))) {
            weeklyHours[dayIndex].forEach(slotHours => {
                slotHours.forEach(timeValue => {
                    allInputsValid = allInputsValid && (timeValue !== '')
                })
            })
        }
    }
    return allInputsValid;
}

export const getMomentWeeklyHours = ({ weeklyHours, daysOpen }) => {
    const newWeeklyHours = {};
    for (const dayIndex in weeklyHours) {

        let newDayHours = null;
        if (daysOpen.includes(Number(dayIndex))) {
            newDayHours = [];

            weeklyHours[dayIndex].forEach(slotHours => {
                newDayHours.push(...slotHours);
            })
        }

        newWeeklyHours[dayIndex] = newDayHours;
    }

    return newWeeklyHours;
}


export const momentToFrontendWeeklyHours = (momentWeeklyHours) => {
    const newWeeklyHours = {};
    const daysOpen = [];
    for (const dayIndex in momentWeeklyHours) {
        let dayHours = [];
        if (Array.isArray(momentWeeklyHours[dayIndex])) {
            daysOpen.push(Number(dayIndex));
            for (let i = 0; i < momentWeeklyHours[dayIndex].length; i += 2) {
                const slotHours = momentWeeklyHours[dayIndex].slice(i, i + 2);
                dayHours.push(slotHours);
            }
        } else {
            dayHours = [['', '']]
        }

        newWeeklyHours[dayIndex] = dayHours;
    }

    return {
        frontendHours: newWeeklyHours,
        daysOpen: daysOpen,
    };
}