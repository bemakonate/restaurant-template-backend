import React, { useState, useEffect } from 'react';
import WeeklyHours, { EnhancedWeeklyHours } from '../../components/WeeklyHoursModule';
import Toggle from '../../components/strapiStyles/Toggle/StrapiToggle';
import pluginId from '../../pluginId';
import { compare } from '../../utils/helpers';
import { InputText, Button, Padded, Label, Textarea } from '@buffetjs/core';
import { request } from 'strapi-helper-plugin'
import EntityAvailability from '../../components/EntityAvailability';
import { useParams, useHistory } from 'react-router-dom';
import classes from './CategoryPage.module.css';



const CategoryPage = (props) => {
    const { id } = useParams();


    const [category, setCategory] = useState(null);
    const [fetchingCategory, setFetchingCategory] = useState(null);
    const [isChangesSaved, setIsChangesSaved] = useState(null);
    const [categoryCurrentAvail, setCategoryCurrentAvail] = useState(null);



    useEffect(() => {
        if (!fetchingCategory && categoryCurrentAvail) {
            if (categoryCurrentAvail.data.source !== category.hours.source) {
                setIsChangesSaved(false);
            }
            else if (categoryCurrentAvail.data.source === 'custom' && !compare(JSON.parse(category.hours.open), categoryCurrentAvail.data.open)) {
                setIsChangesSaved(false);
            }
            else {
                setIsChangesSaved(true);
            }
        } else {
            setIsChangesSaved(true);
        }


    }, [fetchingCategory, categoryCurrentAvail])

    useEffect(() => {
        const run = async () => await getCategory();
        run();
    }, [])




    const getCategory = async () => {
        setFetchingCategory(true);
        try {
            const category = await request(`/${pluginId}/categories/${id}`, { method: "GET" });
            setCategory(category);
            setFetchingCategory(false);
        } catch (error) {
            strapi.notification.error(error.message);
            setFetchingCategory(false);
            props.history.push(`/plugins/${pluginId}/404`);

        }
    }

    const updateCategoryData = async ({ source, open, closed }) => {
        try {
            const res = await request(`/${pluginId}/categories/${id}`, {
                method: "POST",
                body: {
                    hours: { open, closed },
                    source,
                }
            });
            strapi.notification.success("success");
            getCategory();
        } catch (error) {
            strapi.notification.error(error.message);
        }
    }

    const saveBtnClicked = () => {
        if (categoryCurrentAvail.error) {
            alert(categoryCurrentAvail.error.message);
            return null;
        }


        updateCategoryData({
            source: categoryCurrentAvail.data.source,
            open: categoryCurrentAvail.data.open,
            closed: categoryCurrentAvail.data.closed,
        })
    }


    const goBackBtnClicked = () => {
        if (!isChangesSaved) {
            const discardChanges = confirm("changes weren't saved");
            if (discardChanges) {
                props.history.goBack();
            }
        } else {
            props.history.goBack()
        }
    }



    let categoryJSX = null;
    if (category) {
        categoryJSX = (
            <React.Fragment>
                {/* Save Buttons */}
                <h1>{category.name}</h1>
                <p>Advance Settings</p>
                <div>
                    <Button onClick={goBackBtnClicked}>Go Back</Button>
                    <Button color="success" label="Save" onClick={saveBtnClicked} disabled={isChangesSaved} />
                </div>


                <EntityAvailability
                    open={JSON.parse(category.hours.open)}
                    source={category.hours.source}
                    getEntityAvailability={(data) => setCategoryCurrentAvail(data)}
                    limitSources={['business', 'none', 'custom']}
                />
            </React.Fragment>
        )
    }

    return (
        <div>
            {categoryJSX}
        </div>
    )
}

export default CategoryPage
