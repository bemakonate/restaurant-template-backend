
import React, { memo } from 'react';
// import PropTypes from 'prop-types';
import pluginId from '../../pluginId';

const HomePage = () => {
    return (
        <div>
            <p>Home page</p>
            <a href={`/plugins/${pluginId}/business-hours`}>Business Hours</a>
            <br />
            <a href={`/plugins/${pluginId}/categories`}>Categories Hours</a>
            <br />
            <a href={`/plugins/${pluginId}/products`}>Products Hours</a>
        </div>
    );
};

export default memo(HomePage);
