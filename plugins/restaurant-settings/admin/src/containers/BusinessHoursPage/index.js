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
import EntityAvailability from '../../components/EntityAvailability';

const BusinessHoursPage = (props) => {
  const [originBusinessHrs, setOriginBusinessHrs] = useState(null);
  const [fetchingBusinessHrs, setFetchingBusinessHrs] = useState(true);
  const [isChangesSaved, setIsChangesSaved] = useState(null);
  const [businessHoursCurrentAvail, setBusinessHoursCurrentAvail] = useState(null);


  useEffect(() => {
    const run = async () => await getBusinessHours();
    run();
  }, []);


  useEffect(() => {
    if (!fetchingBusinessHrs && businessHoursCurrentAvail) {
      if (businessHoursCurrentAvail.data.source !== originBusinessHrs.source) {
        setIsChangesSaved(false);
      }
      else if (businessHoursCurrentAvail.data.source === 'custom' && !compare(JSON.parse(originBusinessHrs.open), businessHoursCurrentAvail.data.open)) {
        setIsChangesSaved(false);
      }
      else {
        setIsChangesSaved(true);
      }
    } else {
      setIsChangesSaved(true);
    }


  }, [fetchingBusinessHrs, businessHoursCurrentAvail])



  const getBusinessHours = async () => {
    setFetchingBusinessHrs(true);
    const businessHours = await request(`/${pluginId}/business-hours`, { method: 'GET' });
    setOriginBusinessHrs(businessHours);
    setFetchingBusinessHrs(false);
  }



  const updateBusinessHours = async ({ source, open, closed }) => {
    strapi.lockApp();
    try {
      const res = await request(`/${pluginId}/business-hours`, {
        method: 'POST',
        body: { open, closed }
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
    if (businessHoursCurrentAvail.error) {
      alert(businessHoursCurrentAvail.error.message);
      return null;
    }


    updateBusinessHours({
      source: businessHoursCurrentAvail.data.source,
      open: businessHoursCurrentAvail.data.open,
      closed: businessHoursCurrentAvail.data.closed,
    })
  }

  return (
    <div>
      <div>
        <Button onClick={goBackBtnClicked}>Go Back</Button>
        <Button color="success" label="Save" onClick={saveBtnClicked} disabled={isChangesSaved} />
      </div>

      {originBusinessHrs && <EntityAvailability
        fixedCustomHours
        open={JSON.parse(originBusinessHrs.open)}
        getEntityAvailability={(data) => setBusinessHoursCurrentAvail(data)}
      />}
    </div>
  );
};

export default memo(BusinessHoursPage);