import React, { useEffect, useState } from 'react';
import {
    isWeeklyHoursValid,
    getMomentWeeklyHours,
    validateBusinessHours as validateMomentWeeklyHours,
    momentToFrontendWeeklyHours
} from './helpers';
import { daysOfTheWeek } from './constants';
import classes from './WeeklyHours.module.css';
import WeekdayHoursContext from './context';
import DayHours from './DayHours/DayHours';

// const FrontentHoursExample = {
//     0: [
//       ['06:30:00', '12:00:00'],
//       ['13:30:00', '17:00:00'],
//     ],
//     1: [
//       ['09:30:00', '17:00:00'],
//     ],
//     2: null,
//     3: null,
//     4: [
//       ['06:30:00', '12:00:00'],
//       ['13:30:00', '17:00:00'],
//     ],
//     5: null,
//     6: null,
//   };

const WeeklyHours = (props) => {
    const defaultWeek = {
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
    };
    const [daysOpen, setDaysOpen] = useState(null);
    const [weekdayHrs, setWeekdayHrs] = useState(null);
    const [isSubmitBtnClicked, setIsSubmitBtnClicked] = useState(false);


    const weekdayHrsJSX = [];


    useEffect(() => {
        const newWeekdayHrs = momentToFrontendWeeklyHours(props.originWeeklyHours ? props.originWeeklyHours : defaultWeek);
        setDaysOpen(newWeekdayHrs.daysOpen);
        setWeekdayHrs(newWeekdayHrs.frontendHours);
    }, [props.originWeeklyHours])

    useEffect(() => props.getCurrentWeeklyHours && props.getCurrentWeeklyHours(weekdayHrs), [weekdayHrs])
    useEffect(() => {
        const momentWeeklyHours = getMomentWeeklyHours({ weeklyHours: weekdayHrs, daysOpen });
        props.getCurrentMomentWeeklyHours && props.getCurrentMomentWeeklyHours(momentWeeklyHours);
    }, [weekdayHrs, daysOpen]);
    useEffect(() => props.getCurrentDaysOpen && props.getCurrentDaysOpen(daysOpen), [daysOpen])
    useEffect(() => { props.forceSubmit && formSubmitted() }, [props.forceSubmit]);

    const dayOpenChanged = (e) => {
        const newDaysOpen = [...daysOpen];
        const value = Number(e.target.value);
        const dayOpenIndex = newDaysOpen.indexOf(value);

        //If the input is checked and not already added to the list
        if (e.target.checked && dayOpenIndex === -1) {
            newDaysOpen.push(value)
        } else {
            newDaysOpen.splice(dayOpenIndex, 1);
        }

        setDaysOpen(newDaysOpen);
    };


    const addSlot = (dayIndex) => {
        const newWeekdayHrs = { ...weekdayHrs };
        newWeekdayHrs[dayIndex].push(['', '']);
        setWeekdayHrs(newWeekdayHrs);
    }

    const removeSlot = ({ dayIndex, slotIndex }) => {
        const newWeekdayHrs = { ...weekdayHrs };
        delete newWeekdayHrs[dayIndex][slotIndex]
        setWeekdayHrs(newWeekdayHrs);
    }

    const updateSlot = ({ dayIndex, slotIndex, timeIndex, value }) => {
        const newWeekdayHrs = { ...weekdayHrs };
        newWeekdayHrs[dayIndex][slotIndex][timeIndex] = value;
        setWeekdayHrs(newWeekdayHrs);
    }
    //Pass to context to the field input

    const formSubmitted = () => {
        setIsSubmitBtnClicked(true);

        let weeklyFrontendHoursValid = isWeeklyHoursValid({ weeklyHours: weekdayHrs, daysOpen });
        const momentWeeklyHours = getMomentWeeklyHours({ weeklyHours: weekdayHrs, daysOpen });


        //make default different from key
        const momentWeeklyHours2 = momentWeeklyHours;
        const daysOpen2 = daysOpen;
        const afterSubmit = ({
            isWeeklyHoursValid,
            frontendWeeklyHours = weekdayHrs,
            momentWeeklyHours = momentWeeklyHours2,
            daysOpen = daysOpen2,
            error = null
        }) =>
            props.afterSubmit && props.afterSubmit({
                isWeeklyHoursValid,
                frontendWeeklyHours,
                momentWeeklyHours,
                daysOpen,
                error,
            })


        if (!daysOpen.length) {
            return afterSubmit({
                isWeeklyHoursValid: false,
                error: {
                    message: 'At least one day must be choosen for weekly hours'
                }

            })
        }

        if (weeklyFrontendHoursValid) {
            const momentWeeklyHoursValidation = validateMomentWeeklyHours(momentWeeklyHours);
            //If the moment weekly hours is not valid 
            if (momentWeeklyHoursValidation.error) {
                return afterSubmit({
                    isWeeklyHoursValid: momentWeeklyHoursValidation.valid,
                    error: {
                        message: momentWeeklyHoursValidation.error.message
                    }
                });

            }

            //If the moment weekly hours is valid
            return afterSubmit({
                isWeeklyHoursValid: momentWeeklyHoursValidation.valid,
            })
        } else {
            return afterSubmit({
                isWeeklyHoursValid: false,
                error: {
                    message: "You have entered a wrong value"
                },
            })

        }

    }



    if (weekdayHrs) {
        for (const dayValue in weekdayHrs) {
            const day = daysOfTheWeek.find(day => day.value == dayValue);
            const isOpen = daysOpen.includes(day.value);
            const dayHrsJSX = (
                <div key={day.value} className={classes.DayContainer}>
                    <label htmlFor="">{day.name}</label>
                    <input type="checkbox" value={day.value} onChange={(e) => dayOpenChanged(e)} checked={isOpen} />


                    <DayHours
                        slots={weekdayHrs[dayValue]}
                        removeSlot={removeSlot}
                        updateSlot={updateSlot}
                        dayIndex={day.value} />

                    <button onClick={() => addSlot(day.value)}>+</button>
                </div>
            )
            weekdayHrsJSX.push(dayHrsJSX)
        }
    }

    return (
        <div>
            <WeekdayHoursContext.Provider value={{
                isSubmitBtnClicked,
                daysOpen,
            }}>
                {weekdayHrsJSX}
            </WeekdayHoursContext.Provider>

            {!props.hideComponentSubmit && <button onClick={formSubmitted}>Submit</button>}

        </div>

    );

}

export default WeeklyHours;