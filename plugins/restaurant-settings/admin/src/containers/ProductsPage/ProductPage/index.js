import React, { useState, useEffect } from 'react';
import WeeklyHours, { EnhancedWeeklyHours } from '../../../components/WeeklyHoursModule';
import Toggle from '../../../components/strapiStyles/Toggle/StrapiToggle';
import pluginId from '../../../pluginId';
import { compare } from '../../../utils/helpers';
import { InputText, Button, Padded, Label, Textarea } from '@buffetjs/core';
import { request } from 'strapi-helper-plugin'

import { useParams, useHistory } from 'react-router-dom';
import classes from '../../CategoriesPage/CategoryPage/CategoryPage.module.css';



const CategoryPage = (props) => {
    const { id } = useParams();

    const [submitWeeklyHours, setSubmitWeeklyHours] = useState(false);
    const [currentWeeklyHours, setCurrentWeeklyHours] = useState(null);
    const [isChangesSaved, isSetChangesSaved] = useState(null);

    const [product, setProduct] = useState(null);
    const [fetchingProduct, setFetchingProduct] = useState(null);
    const [productSource, setProductSource] = useState(null);
    const [productHours, setProductHours] = useState(null);
    const [updateProduct, setUpdateProduct] = useState(false);





    useEffect(() => {
        if (!fetchingProduct && productSource === 'custom' && !compare(JSON.parse(product.hours.open), currentWeeklyHours)) {
            isSetChangesSaved(false);
        }
        else if (!fetchingProduct && product && productSource !== product.hours.source) {
            isSetChangesSaved(false);
        }
        else {
            isSetChangesSaved(true);
        }

    }, [currentWeeklyHours, productSource, fetchingProduct])

    useEffect(() => {
        const run = async () => await getTimeCategoryData();
        run();
    }, [])

    useEffect(() => {
        const run = async () => updateProduct && await updateProductData();
        run();
    }, [updateProduct])


    const getTimeCategoryData = async () => {
        setFetchingProduct(true);
        try {
            const category = await request(`/${pluginId}/products/${id}`, { method: "GET" });
            setProduct(category);
            setProductHours(JSON.parse(category.hours.open));
            setProductSource(category.hours.source);
            setFetchingProduct(false);
        } catch (error) {
            strapi.notification.error(error.message);
            setFetchingProduct(false);
            props.history.push(`/plugins/${pluginId}/404`);

        }
    }

    const updateProductData = async () => {
        try {
            const res = await request(`/${pluginId}/products/${id}`, {
                method: "POST",
                body: {
                    hours: { open: productHours, closed: null },
                    source: productSource,
                }
            });
            strapi.notification.success("success");
            setUpdateProduct(false);
            getTimeCategoryData();
        } catch (error) {
            strapi.notification.error(error.message);
            setUpdateProduct(false);
        }
    }

    const saveBtnClicked = () => {
        if (productSource === 'custom') {
            setSubmitWeeklyHours(true);
        } else {
            setUpdateProduct(true);
        }
    }

    const goBackBtnClicked = () => {
        if (!isChangesSaved) {
            const discardChanges = confirm("changes weren't saved");
            if (discardChanges) {
                props.history.push(`/plugins/${pluginId}/products`)
            }
        } else {
            props.history.push(`/plugins/${pluginId}/products`)
        }
    }

    const afterWeeklyHoursSubmit = async ({ isWeeklyHoursValid, frontendWeeklyHours, momentWeeklyHours, daysOpen, error }) => {
        setSubmitWeeklyHours(false);
        if (error) {
            alert(error.message);
            return null;
        }

        setProductHours(momentWeeklyHours);
        setUpdateProduct(true);
    }


    //==========RENDER=============
    let categoryHoursJSX = null;

    switch (productSource) {
        case 'custom':
            categoryHoursJSX = null;
            const resetValue = JSON.parse(product.hours.open);
            if (!fetchingProduct) {
                categoryHoursJSX = (
                    <div>
                        <EnhancedWeeklyHours
                            originWeeklyHours={productHours}
                            getCurrentMomentWeeklyHours={(weeklyHours) => setCurrentWeeklyHours(weeklyHours)}
                            resetValue={resetValue}
                            forceSubmit={submitWeeklyHours}
                            afterSubmit={afterWeeklyHoursSubmit} />
                    </div>
                );
            }
            break;
        case 'business':
            categoryHoursJSX = <p>This product will available all business hours</p>
            break;
        case 'categories':
            categoryHoursJSX = <p>This product will take categories hours</p>
            break;

        default:
            categoryHoursJSX = <p>There is no restricted hours in this category</p>
    }


    const SourceOption = (props) => {
        return <li
            onClick={() => setProductSource(props.value)}
            className={productSource === props.value ? classes.ActiveHours : ''}>{props.children}</li>
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
                <SourceOption value="categories">Take Categories Hours</SourceOption>
                <SourceOption value="none">None</SourceOption>
            </ul>
            {categoryHoursJSX}


        </div>
    )
}

export default CategoryPage
