import React, { useState, useEffect } from 'react';
import WeeklyHours, { EnhancedWeeklyHours } from '../../../components/WeeklyHoursModule';
import Toggle from '../../../components/strapiStyles/Toggle/StrapiToggle';
import pluginId from '../../../pluginId';
import { compare } from '../../../utils/helpers';
import { InputText, Button, Padded, Label, Textarea } from '@buffetjs/core';
import { request } from 'strapi-helper-plugin'

import { useParams, useHistory } from 'react-router-dom';
import classes from './CategoryPage.module.css';



const CategoryPage = (props) => {
    const { id } = useParams();

    const [submitWeeklyHours, setSubmitWeeklyHours] = useState(false);
    const [timedCategory, setTimedCategory] = useState(null);
    const [fetchingTimedCategory, setFetchingTimedCategory] = useState(null);
    const [timedCategorySource, setTimedCategorySource] = useState(null);
    const [timedCategoryHours, setTimedCategoryHours] = useState(null);
    const [updateTimeCategory, setUpdateTimeCategory] = useState(false);
    const [currentWeeklyHours, setCurrentWeeklyHours] = useState(null);
    const [isChangesSaved, isSetChangesSaved] = useState(null);




    useEffect(() => {
        if (!fetchingTimedCategory && timedCategorySource === 'custom' && !compare(JSON.parse(timedCategory.hours.open), currentWeeklyHours)) {
            isSetChangesSaved(false);
        }
        else if (!fetchingTimedCategory && timedCategory && timedCategorySource !== timedCategory.hours.source) {
            isSetChangesSaved(false);
        }
        else {
            isSetChangesSaved(true);
        }

    }, [currentWeeklyHours, timedCategorySource, fetchingTimedCategory])

    useEffect(() => {
        const run = async () => await getTimeCategoryData();
        run();
    }, [])

    useEffect(() => {
        const run = async () => updateTimeCategory && await updateTimeCategoryData();
        run();
    }, [updateTimeCategory])


    const getTimeCategoryData = async () => {
        setFetchingTimedCategory(true);
        try {
            const category = await request(`/${pluginId}/categories/${id}`, { method: "GET" });
            setTimedCategory(category);
            setTimedCategoryHours(JSON.parse(category.hours.open));
            setTimedCategorySource(category.hours.source);
            setFetchingTimedCategory(false);
        } catch (error) {
            strapi.notification.error(error.message);
            setFetchingTimedCategory(false);
            props.history.push(`/plugins/${pluginId}/404`);

        }
    }

    const updateTimeCategoryData = async () => {
        try {
            const res = await request(`/${pluginId}/categories/${id}`, {
                method: "POST",
                body: {
                    hours: timedCategoryHours,
                    source: timedCategorySource,
                }
            });
            strapi.notification.success("success");
            setUpdateTimeCategory(false);
            getTimeCategoryData();
        } catch (error) {
            strapi.notification.error(error.message);
            setUpdateTimeCategory(false);
        }
    }

    const saveBtnClicked = () => {
        if (timedCategorySource === 'custom') {
            setSubmitWeeklyHours(true);
        } else {
            setUpdateTimeCategory(true);
        }
    }

    const goBackBtnClicked = () => {
        if (!isChangesSaved) {
            const discardChanges = confirm("changes weren't saved");
            if (discardChanges) {
                props.history.push(`/plugins/${pluginId}/categories`)
            }
        } else {
            props.history.push(`/plugins/${pluginId}/categories`)
        }
    }

    const afterWeeklyHoursSubmit = async ({ isWeeklyHoursValid, frontendWeeklyHours, momentWeeklyHours, daysOpen, error }) => {
        setSubmitWeeklyHours(false);
        if (error) {
            alert(error.message);
            return null;
        }

        setTimedCategoryHours(momentWeeklyHours);
        setUpdateTimeCategory(true);
    }


    //==========RENDER=============
    let categoryHoursJSX = null;

    switch (timedCategorySource) {
        case 'custom':
            categoryHoursJSX = null;
            const resetValue = JSON.parse(timedCategory.hours.open);
            if (!fetchingTimedCategory) {
                categoryHoursJSX = (
                    <div>
                        <EnhancedWeeklyHours
                            originWeeklyHours={timedCategoryHours}
                            getCurrentMomentWeeklyHours={(weeklyHours) => setCurrentWeeklyHours(weeklyHours)}
                            resetValue={resetValue}
                            forceSubmit={submitWeeklyHours}
                            afterSubmit={afterWeeklyHoursSubmit} />
                    </div>
                );
            }
            break;
        case 'business':
            categoryHoursJSX = <p>This category will available all business hours</p>
            break;
        default:
            categoryHoursJSX = <p>There is no restricted hours in this category</p>
    }


    const SourceOption = (props) => {
        return <li
            onClick={() => setTimedCategorySource(props.value)}
            className={timedCategorySource === props.value ? classes.ActiveHours : ''}>{props.children}</li>
    }
    return (
        <div>
            {/* Save Buttons */}
            <div>
                <Button onClick={goBackBtnClicked}>Go Back</Button>
                <Button color="success" label="Save" onClick={saveBtnClicked} disabled={isChangesSaved} />
            </div>



            <ul>
                <SourceOption value="custom">Custom Hours</SourceOption>
                <SourceOption value="business">Business Hours</SourceOption>
                <SourceOption value={null}>None</SourceOption>
            </ul>
            {categoryHoursJSX}


        </div>
    )
}

export default CategoryPage
