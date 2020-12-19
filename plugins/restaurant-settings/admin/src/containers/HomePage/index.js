
import React, { memo } from 'react';
// import PropTypes from 'prop-types';
import pluginId from '../../pluginId';


const HomePage = (props) => {

    return (
        <div>
            <h1>Restaurant</h1>
            <p>Advance Settings</p>

            <p onClick={() => props.history.push(`/plugins/${pluginId}/business-hours`)}>Business Setting</p>
            <p onClick={() => props.history.push(`/plugins/${pluginId}/categories`)}>Categories Setting</p>
            <p onClick={() => props.history.push(`/plugins/${pluginId}/products`)}>Products Setting</p>
        </div>
    );
};

export default memo(HomePage);
