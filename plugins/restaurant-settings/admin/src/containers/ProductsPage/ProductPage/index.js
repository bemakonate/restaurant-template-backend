import React, { useState, useEffect } from 'react';
import WeeklyHours, { EnhancedWeeklyHours } from '../../../components/WeeklyHoursModule';
import Toggle from '../../../components/strapiStyles/Toggle/StrapiToggle';
import pluginId from '../../../pluginId';
import { compare } from '../../../utils/helpers';
import { InputText, Button, Padded, Label, Textarea } from '@buffetjs/core';
import EntityAvailability from '../../../components/EntityAvailability';
import { request } from 'strapi-helper-plugin'

import { useParams, useHistory } from 'react-router-dom';



const ProductPage = (props) => {
    const { id } = useParams();


    const [isChangesSaved, setIsChangesSaved] = useState(null);

    const [product, setProduct] = useState(null);
    const [fetchingProduct, setFetchingProduct] = useState(null);
    const [currentProductAvail, setCurrentProductAvail] = useState(null);


    useEffect(() => {
        if (!fetchingProduct && currentProductAvail) {
            if (currentProductAvail.data.source !== product.hours.source) {
                setIsChangesSaved(false);
            }
            else if (currentProductAvail.data.source === 'custom' && !compare(JSON.parse(product.hours.open), currentProductAvail.data.open)) {
                setIsChangesSaved(false);
            }
            else {
                setIsChangesSaved(true);
            }
        } else {
            setIsChangesSaved(true);
        }


    }, [fetchingProduct, currentProductAvail])

    useEffect(() => {
        const run = async () => await getProduct();
        run();
    }, [])

    const getProduct = async () => {
        setFetchingProduct(true);
        try {
            const product = await request(`/${pluginId}/products/${id}`, { method: "GET" });
            setProduct(product);
            setFetchingProduct(false);
        } catch (error) {
            strapi.notification.error(error.message);
            setFetchingProduct(false);
            props.history.push(`/plugins/${pluginId}/404`);
        }
    }

    const updateProductData = async ({ source, open, closed }) => {
        try {
            const res = await request(`/${pluginId}/products/${id}`, {
                method: "POST",
                body: {
                    hours: { open, closed },
                    source,
                }
            });
            strapi.notification.success("success");

            getProduct();
        } catch (error) {
            strapi.notification.error(error.message);
        }
    }

    const saveBtnClicked = () => {
        if (currentProductAvail.error) {
            alert(currentProductAvail.error.message);
            return null;
        }


        updateProductData({
            source: currentProductAvail.data.source,
            open: currentProductAvail.data.open,
            closed: currentProductAvail.data.closed,
        })
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

    return (
        <div>
            {/* Save Buttons */}
            <div>
                <Button onClick={goBackBtnClicked}>Go Back</Button>
                <Button color="success" label="Save" onClick={saveBtnClicked}
                    disabled={isChangesSaved}
                />
            </div>



            {product && <EntityAvailability
                open={JSON.parse(product.hours.open)}
                source={product.hours.source}
                getEntityAvailability={(data) => setCurrentProductAvail(data)}
            // forceSubmit={submitWeeklyHours} 
            />}


        </div>
    )
}

export default ProductPage
