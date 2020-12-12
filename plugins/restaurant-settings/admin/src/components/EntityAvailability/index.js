import React, { useEffect, useState } from 'react';
import { EnhancedWeeklyHours } from '../../components/WeeklyHoursModule';
import { validateWeeklyHours, compare } from '../../utils/helpers'


const SourceOption = (props) => {
    return (
        <div>
            <li
                onClick={() => props.updateEntitySource(props.value)}
                className={props.currentSource === props.value ? 'active' : ''}>{props.children}</li>
            <style jsx="true">{`
                .active{
                    color:red;
                }
                
            `}</style>
        </div>
    )
}

const EntityAvailability = (props) => {
    //entityAvail = entityAvailability

    const [entityAvail, setEntityAvail] = useState({
        source: null,
        open: null,
        closed: null,
    })

    const allSources = [
        { value: 'custom', text: 'Custom Hours' },
        { value: 'business', text: 'Business Hours' },
        { value: 'categories', text: 'Take Categories Hours' },
        { value: 'none', text: 'None' },
    ]

    const [isEntityAvailValid, setIsEntityAvailValid] = useState(null);
    const [entityAvailError, setEntityAvailError] = useState(null);
    const [originHoursOpen, setOriginHoursOpen] = useState(null);
    const [showSources, setShowSources] = useState(null);


    useEffect(() => {
        //If the value of orign hours changes update the orign
        !compare(props.open, originHoursOpen) && setOriginHoursOpen(props.open)
    }, [props.open])

    useEffect(() => {
        setEntityAvail({
            source: props.fixedCustomHours ? 'custom' : props.source,
            open: props.open,
            closed: props.closed,
        })
        setOriginHoursOpen(props.open);

        if (props.fixedCustomHours) {
            setShowSources(null);
        }
        else if (props.limitSources && Array.isArray(props.limitSources) && props.limitSources.length > 0) {
            const newAllSources = allSources.filter(source => {
                const foundSource = props.limitSources.find(wantedSource => wantedSource === source.value);
                return foundSource
            })

            setShowSources(newAllSources);
        } else {
            setShowSources(allSources);
        }
    }, [])


    //Pass the current entity available data to the parent component
    useEffect(() => {
        props.getEntityAvailability && props.getEntityAvailability({
            data: entityAvail,
            isValidForSubmit: isEntityAvailValid,
            error: entityAvailError
        })
    }, [entityAvail, isEntityAvailValid, entityAvailError])


    useEffect(() => {
        entityAvail.source !== 'custom' && sourceIsRelationship(entityAvail.source);
    }, [entityAvail])



    const validateCustomHours = async ({ isWeeklyHoursValid, frontendWeeklyHours, momentWeeklyHours, daysOpen, error }) => {
        if (error) {
            updateEntityWorkingHours(momentWeeklyHours);
            setEntityAvailError(error);
            setIsEntityAvailValid(false);
            return null;
        }


        //Pass the weekly hours to parent components and is value valid
        updateEntityWorkingHours(momentWeeklyHours);
        setEntityAvailError(null);
        setIsEntityAvailValid(true);
    }


    const updateEntitySource = (source = entityAvail.source) => {
        //Pass the weekly hours to parent components and is value valid
        if (source === 'custom') {
            setEntityAvail({ ...entityAvail, source })
        } else {
            setEntityAvail({ ...entityAvail, source, open: null, closed: null });
        }
    }

    const sourceIsRelationship = (source) => {
        setEntityAvailError(null);
        setIsEntityAvailValid(true);
    }

    const updateEntityWorkingHours = (workingHours) => {
        setEntityAvail({ ...entityAvail, open: workingHours })
    }


    //==========RENDER=============
    let entityWorkingHoursJSX = null;

    switch (entityAvail.source) {
        case 'custom':

            entityWorkingHoursJSX = (
                <div>
                    <EnhancedWeeklyHours
                        originWeeklyHours={originHoursOpen}
                        resetValue={originHoursOpen}
                        getWeeklyHoursStatus={(data) => validateCustomHours(data)} />
                </div>
            );

            break;
        case 'business':
            entityWorkingHoursJSX = <p>This product will available all business hours</p>
            break;
        case 'categories':
            entityWorkingHoursJSX = <p>This product will take categories hours</p>
            break;

        default:
            entityWorkingHoursJSX = <p>There is no restricted hours in this category</p>
    }





    return (
        <div>
            <div className="working-hours">
                <ul>
                    {showSources && showSources.length > 0 && showSources.map((source, index) => {
                        return <SourceOption
                            key={index}
                            value={source.value}
                            currentSource={entityAvail.source}
                            updateEntitySource={updateEntitySource}>{source.text}</SourceOption>
                    })}
                </ul>
                {entityWorkingHoursJSX}
            </div>


        </div>
    )
}

export default EntityAvailability;



//===Props====
// open: object/null
// closed: object/null
// source: string

//====Return value====
// {
//     error:{
//          message: ______,
//     },
//     isValidForSubmit: true/false,
//     data{
//         source: ____,
//         open: _____,
//         closed: _____,
//     }
// }
