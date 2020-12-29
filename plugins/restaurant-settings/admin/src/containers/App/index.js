/**
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { NotFound } from 'strapi-helper-plugin';
// Utils
import pluginId from '../../pluginId';
// Containers

import BusinessHoursPage from '../BusinessHoursPage'
import CategoryPage from '../CategoryPage';
import ProductPage from '../ProductPage';
import OrderPage from '../OrderPage';

const App = () => {
  return (
    <div>
      <Switch>
        <Route path={`/plugins/${pluginId}/categories/:id`} component={CategoryPage} />
        <Route path={`/plugins/${pluginId}/products/:id`} component={ProductPage} />
        <Route path={`/plugins/${pluginId}/orders/:id`} component={OrderPage} />
        <Route path={`/plugins/${pluginId}`} component={BusinessHoursPage} exact />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default App;
