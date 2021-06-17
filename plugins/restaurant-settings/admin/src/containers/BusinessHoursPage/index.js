import React, { memo, useEffect, useState, useContext } from 'react';
import pluginId from '../../pluginId';
import { request } from 'strapi-helper-plugin';
import { compare } from '../../utils/helpers';
import EntityAvailability from '../../components/EntityAvailability';
import { Button, Padded, InputNumber, Select } from '@buffetjs/core';
import styled from 'styled-components'
import classes from './BusinessHours.module.css';

const defaultValues = {
  hours: {
    open: JSON.stringify(null),
    closed: JSON.stringify(null)
  }
}

const BusinessHoursPage = (props) => {
  const [fetchingBusinessData, setFetchingBusinessData] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [currentBusinessData, setCurrentBusinessData] = useState(null);
  const [isChangesSaved, setIsChangesSaved] = useState(null);
  const [isInitialSetUp, setIsInitialSetUp] = useState(null);
  const [businessHoursCurrentAvail, setBusinessHoursCurrentAvail] = useState(null);


  useEffect(() => {
    const run = async () => {
      strapi.lockApp();
      await getBusinessData();
      strapi.unlockApp();
    }
    run();
  }, []);


  useEffect(() => {
    const currentBusinessData = {
      hours: { open: null, closed: null },
    }

    if (businessData) {
      currentBusinessData.hours.open = JSON.stringify(businessHoursCurrentAvail.data.open);
      currentBusinessData.hours.closed = JSON.stringify(null);
    }
    setCurrentBusinessData(currentBusinessData);
  }, [businessHoursCurrentAvail])


  useEffect(() => {
    if (!fetchingBusinessData && !compare(currentBusinessData, businessData)) {
      setIsChangesSaved(false);
    } else {
      setIsChangesSaved(true);
    }


  }, [fetchingBusinessData, currentBusinessData])




  const getBusinessData = async () => {
    setFetchingBusinessData(true);
    const res = await request(`/${pluginId}/business`, { method: 'GET' });
    setBusinessData(res.business || defaultValues);
    setIsInitialSetUp(!res.business ? true : false);
    setFetchingBusinessData(false);
  }



  const saveBtnClicked = () => {
    if (businessHoursCurrentAvail.error) {
      alert(businessHoursCurrentAvail.error.message);
      return null;
    }
    updateBusinessData();
  }


  const updateBusinessData = async () => {
    strapi.lockApp();
    try {
      const businessData = {
        hours: { open: businessHoursCurrentAvail.data.open, closed: null },
      }

      const res = await request(`/${pluginId}/business`, {
        method: 'POST',
        body: businessData,
      });

      strapi.notification.success('success');
      await getBusinessData();
      strapi.unlockApp();

    } catch (err) {
      strapi.notification.error(err.toString());
      strapi.unlockApp();
    }
  }


  return (
    <div className={classes.Container}>
      {isInitialSetUp ? <h1 className={classes.PageTitle}>Create New Business Setting </h1> : <h1 className={classes.PageTitle}>Business Setting </h1>}
      <div>
        <Button color="success" label="Save" onClick={saveBtnClicked} disabled={isChangesSaved} />
      </div>

      {businessData && <EntityAvailability
        fixedCustomHours
        open={JSON.parse(businessData.hours.open)}
        getEntityAvailability={(data) => setBusinessHoursCurrentAvail(data)}
      />}



    </div>
  );
};


export default memo(BusinessHoursPage);