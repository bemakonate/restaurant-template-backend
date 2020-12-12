import React, { useState, useEffect } from 'react'
import WeeklyHours from '../WeeklyHours';

const EnhancedWeeklyHours = (props) => {
    const [originWeeklyHours, setOriginWeeklyHours] = useState(null);

    useEffect(() => {
        props.originWeeklyHours && setOriginWeeklyHours(props.originWeeklyHours);
    }, [props.originWeeklyHours])


    return (
        <div>
            <button onClick={() => setOriginWeeklyHours(null)}>Clear</button>
            <button onClick={() => setOriginWeeklyHours(props.resetValue)}>Reset</button>
            <WeeklyHours
                originWeeklyHours={originWeeklyHours}
                getWeeklyHoursStatus={props.getWeeklyHoursStatus}
            // forceSubmit={props.forceSubmit}
            // getCurrentMomentWeeklyHours={getCurrentMomentWeeklyHours}
            // afterSubmit={props.afterSubmit}
            // hideComponentSubmit
            />
        </div>
    )
}

export default EnhancedWeeklyHours
