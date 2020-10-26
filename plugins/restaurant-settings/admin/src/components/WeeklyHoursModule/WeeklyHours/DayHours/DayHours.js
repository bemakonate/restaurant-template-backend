import React from 'react';
import classes from '../WeeklyHours.module.css';
import SlotHours from '../SlotHours/SlotHours';

const DayHours = (props) => {

    if (props.slots && props.slots.length > 0) {

        const slotsJSX = props.slots.map((slot, index) => {
            return <SlotHours
                key={index}
                slotIndex={index}
                slot={slot}
                dayIndex={props.dayIndex}
                removeSlot={props.removeSlot}
                updateSlot={props.updateSlot}
                hideRemove={index === 0} />
        })

        return <div className={classes.BusinessSlots}>
            {slotsJSX}
        </div>
    }

    return null;
}

export default DayHours;