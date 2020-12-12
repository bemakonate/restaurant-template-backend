import React, { useState, useEffect } from 'react';
import classes from './TimeField.module.css';

const TimeField = (props) => {


    const [timeInputValue, setTimeInputValue] = useState(props.defaultValue ? props.defaultValue : '');
    const [isFieldValid, setIsFieldValid] = useState(false);
    const [isFieldTouched, setIsFieldTouched] = useState(false);



    useEffect(() => {
        props.getValue && props.getValue(timeInputValue)
        timeInputValue ? setIsFieldValid(true) : setIsFieldValid(false);
    }, [timeInputValue]);

    useEffect(() => {
        props.getIsValid && props.getIsValid(isFieldValid);
    }, [isFieldValid])


    useEffect(() => {
        if (props.defaultValue !== timeInputValue) {
            setTimeInputValue(props.defaultValue);
        }
    }, [props.defaultValue])




    const fieldChanged = (e) => setTimeInputValue(e.target.value);
    const userTouchedField = (e) => setIsFieldTouched(true);


    return (
        <div
            className={`${(props.waitUntilTouched && isFieldTouched && !isFieldValid) ||
                (props.forceValidationStyle && !isFieldValid) ? classes.TimeFieldError : ''}`}>
            <label className={`${classes.TimeInputLabel}`} htmlFor="timeInput">{props.label}</label>
            <input
                onChange={fieldChanged}
                onKeyDown={userTouchedField}
                className={classes.TimeInput}
                type="time"
                id="timeInput"
                value={timeInputValue} />
        </div>
    )
}

export default TimeField;