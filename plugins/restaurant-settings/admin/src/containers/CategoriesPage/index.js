import React, { useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import Table from '../../components/strapiStyles/Table/Table';
import { Button } from '@buffetjs/core';

const CategoriesPage = (props) => {
    const [fetchingTimedCategories, setFetchingTimedCategories] = useState(null);
    const [timedCategories, setTimedCategories] = useState(null);

    useEffect(() => {
        const run = async () => {
            setFetchingTimedCategories(true);
            const res = await request(`/${pluginId}/categories`, { method: 'GET' });
            setTimedCategories(res);
            setFetchingTimedCategories(false);
        }
        run();
    }, [])

    const headers = [
        {
            name: 'Id',
            value: 'id',
            isSortEnabled: true,
        },
        {
            name: 'Name',
            value: 'name',
            isSortEnabled: true,
        },
        {
            name: 'Hours',
            value: 'hours',
            isSortEnabled: true,
        },
    ];

    let timedCategoriesTable = null;
    const goBackBtnClicked = () => props.history.push(`/plugins/${pluginId}`);
    if (timedCategories && timedCategories.length > 0) {
        const tableRows = timedCategories.map((timedCategory) => {
            return {
                id: timedCategory.id,
                name: timedCategory.name,
                hours: timedCategory.hours.source,
            }
        })

        timedCategoriesTable = (
            <Table
                headers={headers}
                rows={tableRows}
                onClickRow={(e, data) => props.history.push(`/plugins/${pluginId}/category/${data.id}`)} />

        )
    }


    return (
        <div>
            <h1>Categories</h1>
            <p>Advance Settings</p>
            <Button onClick={goBackBtnClicked}>Go Back</Button>
            {timedCategoriesTable}
        </div>
    )
}

export default CategoriesPage;