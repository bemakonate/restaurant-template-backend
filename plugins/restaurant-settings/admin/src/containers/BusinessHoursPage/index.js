/*
 *
 * HomePage
 *
 */

import React, { memo, useEffect, useState, useContext } from 'react';
import classes from './BusinessHours.module.css';
import WeeklyHours, { EnhancedWeeklyHours } from '../../components/WeeklyHoursModule';
import pluginId from '../../pluginId';
import { request } from 'strapi-helper-plugin';
import { Button } from '@buffetjs/core';
import { compare } from '../../utils/helpers';


const BusinessHoursPage = (props) => {
  const [originBusinessHrs, setOriginBusinessHrs] = useState(null);
  const [fetchingBusinessHrs, setFetchingBusinessHrs] = useState(true);
  const [currentWeeklyHours, setCurrentWeeklyHours] = useState(null);
  const [submitWeeklyHours, setSubmitWeeklyHours] = useState(false);
  const [isChangesSaved, setIsChangesSaved] = useState(null);


  useEffect(() => {
    const run = async () => {
      await getBusinessHours();
    }

    run();
  }, []);

  useEffect(() => {
    if (!fetchingBusinessHrs && !compare(currentWeeklyHours, originBusinessHrs)) {
      setIsChangesSaved(false)
    }
    else {
      setIsChangesSaved(true);
    }
  }, [fetchingBusinessHrs, currentWeeklyHours, originBusinessHrs])



  const getBusinessHours = async () => {
    setFetchingBusinessHrs(true);
    const businessHours = await request(`/${pluginId}/business-hours`, { method: 'GET' });
    setOriginBusinessHrs(JSON.parse(businessHours.open));
    setFetchingBusinessHrs(false);
  }



  const afterSubmit = async ({ isWeeklyHoursValid, frontendWeeklyHours, momentWeeklyHours, daysOpen, error }) => {
    setSubmitWeeklyHours(false);
    strapi.lockApp();
    if (error) {
      strapi.notification.error(error.message);
      strapi.unlockApp();
      return null;
    }

    try {
      const res = await request(`/${pluginId}/business-hours`, {
        method: 'POST',
        body: { open: momentWeeklyHours, closed: null }
      });

      strapi.notification.success('success');
      await getBusinessHours();
      strapi.unlockApp();


    } catch (err) {
      strapi.notification.error(err.toString());
      strapi.unlockApp();
    }

  }

  const goBackBtnClicked = () => {
    if (!isChangesSaved) {
      const discardChanges = confirm("changes weren't saved");
      if (discardChanges) {
        props.history.goBack();
      }
    } else {
      props.history.goBack();
    }
  }

  const saveBtnClicked = () => {
    setSubmitWeeklyHours(true);
  }

  return (
    <div>
      <div>
        <Button onClick={goBackBtnClicked}>Go Back</Button>
        <Button color="success" label="Save" onClick={saveBtnClicked} disabled={isChangesSaved} />
      </div>

      {!fetchingBusinessHrs &&
        <EnhancedWeeklyHours
          originWeeklyHours={originBusinessHrs}
          resetValue={originBusinessHrs}
          forceSubmit={submitWeeklyHours}
          getCurrentMomentWeeklyHours={(weeklyHours) => setCurrentWeeklyHours(weeklyHours)}
          afterSubmit={afterSubmit} />
      }
    </div>
  );
};

export default memo(BusinessHoursPage);