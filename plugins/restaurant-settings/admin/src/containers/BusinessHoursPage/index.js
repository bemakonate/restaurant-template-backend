/*
 *
 * HomePage
 *
 */

import React, { memo, useEffect, useState, useContext } from 'react';
import classes from './BusinessHours.module.css';
import WeeklyHours from '../../components/WeeklyHoursModule';
import pluginId from '../../pluginId';
import { request } from 'strapi-helper-plugin';


const BusinessHoursPage = () => {
  const [originBusinessHrs, setOriginBusinessHrs] = useState(null);
  const [fetchingBusinessHrs, setFetchingBusinessHrs] = useState(true);


  useEffect(() => {
    const run = async () => {
      await getBusinessHours();
    }

    run();
  }, []);



  const getBusinessHours = async () => {
    setFetchingBusinessHrs(true);
    const res = await request(`/${pluginId}`, { method: 'GET' });
    const { businessHours } = res;
    setOriginBusinessHrs(businessHours);
    setFetchingBusinessHrs(false);
  }



  const afterSubmit = async ({ isWeeklyHoursValid, frontendWeeklyHours, momentWeeklyHours, daysOpen, error }) => {
    strapi.lockApp();
    if (error) {
      strapi.notification.error(error.message);
      strapi.unlockApp();
      return null;
    }

    try {
      const res = await request(`/${pluginId}`, {
        method: 'POST',
        body: { businessHours: momentWeeklyHours }
      });

      strapi.notification.success('success');
      await getBusinessHours();
      strapi.unlockApp();


    } catch (err) {
      strapi.notification.error(err.toString());
      strapi.unlockApp();
    }

  }

  return (
    <div>
      {!fetchingBusinessHrs && <WeeklyHours
        originWeeklyHours={originBusinessHrs}
        afterSubmit={afterSubmit}
      />}
    </div>
  );
};

export default memo(BusinessHoursPage);