import React, { useContext } from 'react';
import WeekdayHoursContext from '../context';
import classes from '../WeeklyHours.module.css';
import TimeField from '../../TimeField';
const SlotHours = (props) => {

    const context = useContext(WeekdayHoursContext);


    return (
        <div className={classes.BusinessSlotRow}>
            <div className={classes.BusinessSlot}>
                <TimeField
                    label="Start"
                    defaultValue={props.slot ? props.slot[0] : ''}
                    forceValidationStyle={context.isSubmitBtnClicked && context.daysOpen.includes(props.dayIndex)}
                    getValue={(value) => props.slot && props.updateSlot({
                        dayIndex: props.dayIndex,
                        slotIndex: props.slotIndex,
                        timeIndex: 0,
                        value
                    })}

                />
                <span>to</span>
                <TimeField
                    label="End"
                    defaultValue={props.slot ? props.slot[1] : ''}
                    forceValidationStyle={context.isSubmitBtnClicked}
                    forceValidationStyle={context.isSubmitBtnClicked && context.daysOpen.includes(props.dayIndex)}
                    getValue={(value) => props.slot && props.updateSlot({
                        dayIndex: props.dayIndex,
                        slotIndex: props.slotIndex,
                        timeIndex: 1,
                        value
                    })}
                />
            </div>
            {!props.hideRemove ?
                <button onClick={() => props.removeSlot({ dayIndex: props.dayIndex, slotIndex: props.slotIndex })}>Remove</button>
                : null}
        </div>
    )
}


export default SlotHours;