import React from 'react';

import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import App from './containers/App';
import Initializer from './containers/Initializer';
import lifecycles from './lifecycles';
import trads from './translations';
import PluginSecretsPage from './containers/PluginSecretsPage'
import { withRouter } from "react-router";


export default strapi => {
  const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
  const icon = pluginPkg.strapi.icon;
  const name = pluginPkg.strapi.name;

  const plugin = {
    blockerComponent: null,
    blockerComponentProps: {},
    description: pluginDescription,
    icon,
    id: pluginId,
    initializer: Initializer,
    injectedComponents: [],
    isReady: false,
    isRequired: pluginPkg.strapi.required || false,
    layout: null,
    lifecycles,
    mainComponent: App,
    name,
    preventComponentRendering: false,
    trads,
    settings: {
      menuSection: {
        id: "Internalization",
        title: {
          id: pluginId,
          defaultMessage: 'Restuarant Settings'
        },
        links: [
          {
            title: {
              id: `${pluginId}.secrets`,
              defaultMessage: 'Secrets'
            },
            to: `${strapi.settingsBaseURL}/${pluginId}/secrets`,
            Component: PluginSecretsPage,
          }
        ]
      },

    },
    menu: {
      pluginsSectionLinks: [
        {
          destination: `/plugins/${pluginId}`,
          icon,
          label: {
            id: `${pluginId}.plugin.name`,
            defaultMessage: 'Restaurant Settings',
          },
          name,
          permissions: [
            // Uncomment to set the permissions of the plugin here
            // {
            //   action: '', // the action name should be plugins::plugin-name.actionType
            //   subject: null,
            // },
          ],
        },
      ],
    },
  };

  const AdvBtn = withRouter((props) => {
    const contentType = props.contentTypeUID.substr(29);

    let routePush = null;
    const route = props.attribute.route;
    const paramId = props.attribute.paramId;
    const useParam = props.attribute.useParam;

    if (route) {
      let routeLink = route;
      if (useParam) {
        routeLink += `/${props.match.params[paramId]}`
      }
      routePush = () => props.history.push(routeLink);
    }
    return (
      <div>
        <button
          onClick={routePush}>
          {props.attribute.text}
        </button>
      </div>
    )
  });

  strapi.registerField({ type: 'json', Component: AdvBtn });
  return strapi.registerPlugin(plugin);
};
