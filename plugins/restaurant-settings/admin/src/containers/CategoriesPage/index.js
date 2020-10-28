import React, { useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import Table from '../../components/strapiStyles/Table/Table';
// import CategoryHour from '../TimedCategoryPage';

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
                onClickRow={(e, data) => props.history.push(`/plugins/${pluginId}/categories/${data.id}`)} />

        )
    }


    return (
        <div>
            {timedCategoriesTable}
        </div>
    )
}

export default CategoriesPage;