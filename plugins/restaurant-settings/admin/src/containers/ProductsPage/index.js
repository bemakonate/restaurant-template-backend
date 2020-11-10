import React, { useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import Table from '../../components/strapiStyles/Table/Table';

const ProductsPage = (props) => {
    const [fetchingProducts, setFetchingProducts] = useState(null);
    const [products, setProducts] = useState(null);

    useEffect(() => {
        const run = async () => {
            setFetchingProducts(true);
            const res = await request(`/${pluginId}/products`, { method: 'GET' });
            setProducts(res);
            setFetchingProducts(false);
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

    let productsTable = null;
    if (products && products.length > 0) {
        const tableRows = products.map((product) => {
            return {
                id: product.id,
                name: product.name,
                // hours: product.hours.source,
            }
        })

        productsTable = (
            <Table
                headers={headers}
                rows={tableRows}
                onClickRow={(e, data) => props.history.push(`/plugins/${pluginId}/products/${data.id}`)} />

        )
    }


    return (
        <div>
            {productsTable}
        </div>
    )
}

export default ProductsPage;