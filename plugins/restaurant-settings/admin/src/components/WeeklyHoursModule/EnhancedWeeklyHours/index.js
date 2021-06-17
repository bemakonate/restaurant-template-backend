import React, { useState, useEffect } from 'react'
import WeeklyHours from '../WeeklyHours';
import classes from "./EnhancedWeeklyHours.module.css"

const EnhancedWeeklyHours = (props) => {
    const [originWeeklyHours, setOriginWeeklyHours] = useState(null);

    useEffect(() => {
        props.originWeeklyHours && setOriginWeeklyHours(props.originWeeklyHours);
    }, [props.originWeeklyHours])


    return (
        <div>
            <button className={[classes.changeBtn, classes.clearBtn].join(' ')} onClick={() => setOriginWeeklyHours(null)}>Clear</button>
            <button className={[classes.changeBtn, classes.resetBtn].join(' ')} onClick={() => setOriginWeeklyHours(props.resetValue)}>Reset</button>
            <WeeklyHours
                originWeeklyHours={originWeeklyHours}
                getWeeklyHoursStatus={props.getWeeklyHoursStatus} />
        </div>
    )
}

export default EnhancedWeeklyHours
