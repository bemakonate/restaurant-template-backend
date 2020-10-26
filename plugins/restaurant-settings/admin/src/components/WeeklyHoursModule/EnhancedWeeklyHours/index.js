import React, { useState, useEffect } from 'react'
import WeeklyHours from '../WeeklyHours';

const EnhancedWeeklyHours = (props) => {
    const [originWeeklyHours, setOriginWeeklyHours] = useState(null);


    useEffect(() => {
        props.originWeeklyHours && setOriginWeeklyHours(props.originWeeklyHours);
    }, [props.originWeeklyHours])

    const getCurrentMomentWeeklyHours = (weeklyHours) => props.getCurrentMomentWeeklyHours && props.getCurrentMomentWeeklyHours(weeklyHours)

    return (
        <div>
            <button onClick={() => setOriginWeeklyHours(null)}>Clear</button>
            <button onClick={() => setOriginWeeklyHours(props.resetValue)}>Reset</button>
            <WeeklyHours
                hideComponentSubmit
                originWeeklyHours={originWeeklyHours}
                getCurrentMomentWeeklyHours={getCurrentMomentWeeklyHours}
                forceSubmit={props.forceSubmit}
                afterSubmit={props.afterSubmit} />
        </div>
    )
}

export default EnhancedWeeklyHours
