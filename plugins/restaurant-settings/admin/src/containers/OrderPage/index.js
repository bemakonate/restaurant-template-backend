import React, { useState, useEffect } from 'react'
import { request } from 'strapi-helper-plugin'
import pluginId from '../../pluginId';
import { Button } from '@buffetjs/core';

const OrderPage = (props) => {
    const [orderData, setOrderData] = useState(null);
    const [fetchingOrderData, setFetchingOrderData] = useState(null);


    useEffect(() => {
        const run = async () => await getOrderData();
        run();
    }, [])

    const getOrderData = async () => {
        const id = props.match.params.id;
        setFetchingOrderData(true);
        strapi.lockApp();
        try {
            const res = await request(`/${pluginId}/orders/${id}`, { method: "GET" });
            setOrderData(res.order);
            setFetchingOrderData(false);
            strapi.unlockApp();
        } catch (error) {
            setFetchingOrderData(false);
            strapi.unlockApp();
            strapi.notification.error(error.message);
            props.history.push(`/plugins/${pluginId}/404`);

        }
    }

    const goBackBtnClicked = () => props.history.goBack();

    let orderContentJSX = null;
    if (!fetchingOrderData && orderData) {
        orderContentJSX = (
            <div>
                <h1>{orderData.orderId}</h1>
                <p>Date: {orderData.orderDate}</p>
                <p>Pick Up Date: {orderData.pickUpDate} </p>

                <h2>Customer Details</h2>
                <div>
                    <p>Name: {orderData.customerDetails.lastName}, {orderData.customerDetails.firstName}</p>
                    <p>Phone: {orderData.customerDetails.phone}</p>
                    <p>Email: {orderData.customerDetails.email}</p>
                </div>

                <h2>Charge</h2>
                <ul>
                    <li>Subtotal: ${orderData.charge.subtotal}</li>
                    <li>Taxes: ${orderData.charge.taxes}</li>
                    <li>Total: ${orderData.charge.total}</li>
                </ul>

                <h2>Cart</h2>
                <div>
                    {orderData.cart.map((cartItem, index) => (
                        <div key={`cartItem-${index}`}>
                            <h3>{cartItem.productName}</h3>
                            <p>Qty: {cartItem.productQuantity}</p>
                            <p>Single Price: ${cartItem.productPrice}</p>
                            <p>Total Price: ${cartItem.totalPrice}</p>
                            <p>Special Request: {cartItem.specialRequest}</p>
                            <ul>
                                {cartItem.sideProducts.map((sideProduct, index) => {
                                    const extraCost = sideProduct.additionalCost > 0 && <span>+${sideProduct.additionalCost}</span>
                                    return <li key={`sideProduct-${index}`}> {sideProduct.name} {extraCost}</li>
                                })}
                            </ul>
                        </div>
                    ))}

                </div>
            </div>
        )
    }
    return (
        <div>
            <Button onClick={goBackBtnClicked}>Go Back</Button>
            {orderContentJSX}
        </div>
    )
}

export default OrderPage
