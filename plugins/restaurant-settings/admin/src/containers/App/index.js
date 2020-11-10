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
import HomePage from '../HomePage';
import BusinessHoursPage from '../BusinessHoursPage'
import CategoriesPage from '../CategoriesPage'
import CategoryPage from '../CategoriesPage/CategoryPage';
import ProductsPage from '../ProductsPage';
import ProductPage from '../ProductsPage/ProductPage';

const App = () => {
  return (
    <div>
      <Switch>
        <Route path={`/plugins/${pluginId}/business-hours`} component={BusinessHoursPage} exact />
        <Route path={`/plugins/${pluginId}/categories/:id`} component={CategoryPage} exact />
        <Route path={`/plugins/${pluginId}/categories`} component={CategoriesPage} exact />
        <Route path={`/plugins/${pluginId}/products/:id`} component={ProductPage} exact />
        <Route path={`/plugins/${pluginId}/products`} component={ProductsPage} exact />
        <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default App;
