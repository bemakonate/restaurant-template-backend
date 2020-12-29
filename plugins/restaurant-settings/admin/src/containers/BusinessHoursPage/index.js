

import React, { memo, useEffect, useState, useContext } from 'react';
import pluginId from '../../pluginId';
import { request } from 'strapi-helper-plugin';
import { compare } from '../../utils/helpers';
import EntityAvailability from '../../components/EntityAvailability';
import { Button, Padded, InputNumber, Select } from '@buffetjs/core';
import styled from 'styled-components'


const HourAndMinutes = (props) => {

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (props.value) {
      const hours = Math.floor(props.value / 60);
      const mins = props.value % 60;

      setHours(hours);
      setMinutes(mins);
    }
  }, [])

  useEffect(() => {
    if (props.getDurationInMins) {
      let totalMins = 0;
      totalMins += (hours * 60) + minutes;
      props.getDurationInMins(totalMins);

    }
  }, [hours, minutes])
  return (
    <div className={props.className}>
      <InputNumWrapper>
        <div className="inputContainer">
          <div>
            <InputNumber
              onChange={(e) => setHours(e.target.value)}
              value={hours}
              name="hours"
              placeholder="" />
            <span>Hours</span>
          </div>
        </div>
        <span className="colon">:</span>
        <div className="inputContainer">
          <div>
            <InputNumber
              onChange={(e) => setMinutes(e.target.value)}
              value={minutes}
              name="minutes"
              placeholder="" />
            <span>Minutes</span>
          </div>
        </div>
      </InputNumWrapper>
    </div>

  )
}

const InputNumWrapper = styled.div`
  display:flex;
  .inputContainer{
    width:80px;
  }
  .colon{
    font-size:20px;
    margin:0 5px;
  }

`

const defaultValues = {
  isAcceptingOrders: false,
  pickUpVariables: {
    earlyBookingMins: 0,
    pickUpInterval: 0,
    minWaitingTime: 0,
    userSelectionTime: 0,
  },
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
  const [pickUpForm, setPickUpForm] = useState({
    earlyBookingMins: 0,
    pickUpInterval: 0,
    minWaitingTime: 0,
    userSelectionTime: 0,
  });
  const [orderingForm, setOrderingForm] = useState({
    isAcceptingOrders: false,
    taxRate: 0,
    minimumPayment: 0,
  })



  useEffect(() => {
    const run = async () => {
      strapi.lockApp();
      await getBusinessData();
      strapi.unlockApp();
    }
    run();
  }, []);

  useEffect(() => {
    if (businessData) {
      businessData.pickUpVariables && setPickUpForm({ ...businessData.pickUpVariables });
      businessData.ordering && setOrderingForm({ ...businessData.ordering });
    }
  }, [businessData])

  useEffect(() => {
    const currentBusinessData = {
      pickUpVariables: pickUpForm,
      hours: { open: null, closed: null },
      ordering: orderingForm,
    }

    if (businessData) {
      currentBusinessData.hours.open = JSON.stringify(businessHoursCurrentAvail.data.open);
      currentBusinessData.hours.closed = JSON.stringify(null);
    }
    setCurrentBusinessData(currentBusinessData);
  }, [pickUpForm, businessHoursCurrentAvail, orderingForm])


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


  const updatePickUpForm = ({ value, key }) => setPickUpForm({ ...pickUpForm, [key]: value });
  const updateOrderingForm = ({ value, key }) => setOrderingForm({ ...orderingForm, [key]: value });


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
        pickUpVariables: pickUpForm,
        hours: { open: businessHoursCurrentAvail.data.open, closed: null },
        ordering: orderingForm,
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

  const isAcceptingOrdersText = orderingForm.isAcceptingOrders ? 'true' : 'false';
  return (
    <div>
      {isInitialSetUp ? <h1>Create New Business Setting </h1> : <h1>Business Setting </h1>}
      <div>
        <Button color="success" label="Save" onClick={saveBtnClicked} disabled={isChangesSaved} />
      </div>


      <div className="ordering">
        <div>
          <h3>Is Accepting Orders</h3>
          <div onClick={() => updateOrderingForm({ key: 'isAcceptingOrders', value: !orderingForm.isAcceptingOrders })}>
            {isAcceptingOrdersText}
          </div>
        </div>

        <div style={{ width: '200px' }}>
          <h3>Tax rate</h3>
          <p>In percentage(%)</p>
          <InputNumber
            name="tax-rate"
            onChange={(e) => updateOrderingForm({ key: 'taxRate', value: e.target.value })}
            value={orderingForm.taxRate}
            placeholder="" />
        </div>

        <div style={{ width: '200px' }}>
          <h3>Minimum Payment</h3>
          <p>Dollars(3.00)</p>
          <InputNumber
            name="minimum-payment"
            onChange={(e) => updateOrderingForm({ key: 'minimumPayment', value: e.target.value })}
            value={orderingForm.minimumPayment}
            placeholder="" />
        </div>
      </div>

      {!fetchingBusinessData && <PickUpInputs>
        <div className="input-group">
          <h3>Min Waiting Time</h3>
          <HourAndMinutes
            className="HoursAndMinutes"
            value={pickUpForm.minWaitingTime}
            getDurationInMins={(duration) => updatePickUpForm({ value: duration, key: 'minWaitingTime' })} />
        </div>

        <div className="input-group">
          <h3>Pick Up Interval</h3>
          <HourAndMinutes
            className="HoursAndMinutes"
            value={pickUpForm.pickUpInterval}
            getDurationInMins={(duration) => updatePickUpForm({ value: duration, key: 'pickUpInterval' })} />
        </div>

        <div className="input-group">
          <h3>Early Booking</h3>
          <span>How early can user ordering in advance?</span>
          <HourAndMinutes
            className="HoursAndMinutes"
            value={pickUpForm.earlyBookingMins}
            getDurationInMins={(duration) => updatePickUpForm({ value: duration, key: 'earlyBookingMins' })} />
        </div>

        <div className="input-group">
          <h3>Selection Time</h3>
          <span>Minimum time user should have to create order?</span>
          <HourAndMinutes
            className="HoursAndMinutes"
            value={pickUpForm.userSelectionTime}
            getDurationInMins={(duration) => updatePickUpForm({ value: duration, key: 'userSelectionTime' })} />
        </div>

      </PickUpInputs>}

      {businessData && <EntityAvailability
        fixedCustomHours
        open={JSON.parse(businessData.hours.open)}
        getEntityAvailability={(data) => setBusinessHoursCurrentAvail(data)}
      />}



    </div>
  );
};


const PickUpInputs = styled.div`
display:grid;
grid-template-columns: repeat(auto-fit, 300px);
column-gap:10px;
row-gap:20px;

.input-group{
  display: flex;
  flex-direction: column;
}

.HoursAndMinutes{
  margin-top:auto;
}

`;
export default memo(BusinessHoursPage);