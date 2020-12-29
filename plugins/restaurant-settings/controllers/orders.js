const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');
const uninitializedStripe = require('stripe');
const orderid = require('order-id')(process.env.ORDER_ID_SECRET);
const moment = require('moment-timezone');

module.exports = {
    setUpStripe: async (ctx) => {
        //Through ctx.request.body we will receive the products and the quantity

        //Only take the id of each product
        const { cart, pickUpTime } = ctx.request.body;

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();

        const { stripePKSecret } = await pluginStore.get({ key: 'secrets' })
        const stripe = uninitializedStripe(stripePKSecret);


        const newCart = await plugin.services.cart.getPopulatedValidCart({ cart, pickUpTime: pickUpTime });
        const { isCartChanged, populatedCart, receipt, valid } = newCart;

        //Must be less than 500 char
        const receiptCart = populatedCart.map(cartItem => {
            return { id: cartItem.product.id, qty: cartItem.qty }
        })



        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(receipt.total * 100),
                currency: 'usd',
                payment_method_types: ['card'],
                metadata: { validatedCart: JSON.stringify(receiptCart) }
            });

            return {
                summary: receipt,
                paymentIntent,
                valid,
                isCartChanged,
                cart: populatedCart,
            }
        } catch (err) {
            return { error: err.raw.message }
        }
    },
    createOrder: async (ctx) => {
        const {
            paymentIntent,
            cart,
            contact,
            pickUpTime
        } = ctx.request.body;


        const formatedPickUpTime = moment(new Date(parseInt(pickUpTime))).tz('America/New_York').format('lll');

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.index.pluginStore();

        const { stripePKSecret } = await pluginStore.get({ key: 'secrets' })
        const stripe = uninitializedStripe(stripePKSecret);

        //Payment intent for validation
        let paymentInfo;
        try {
            paymentInfo = await stripe.paymentIntents.retrieve(paymentIntent.id);
            if (paymentInfo.status !== 'succeeded') {
                throw { message: "You still have to pay" }
            }
        } catch (err) {
            ctx.response.status = 402;
            return { error: err.message }
        }

        const paymentIntentId = paymentIntent.id;

        //Check if paymentIntent wasn't already used
        const alreadyExistingOrder = await strapi.query("order", pluginId).find({ paymentIntentId })

        if (alreadyExistingOrder && alreadyExistingOrder.length > 0) {
            ctx.response.status = 402;
            return { error: "This payment intent was already used" }
        }


        const newCart = await plugin.services.cart.getPopulatedValidCart({ cart, pickUpTime: pickUpTime });
        const { isCartChanged, populatedCart, receipt, valid } = newCart;

        const orderCart = populatedCart.map((cartItem) => {
            return {
                productName: cartItem.product.name,
                productPrice: cartItem.product.price,
                productId: cartItem.product.id,
                productQuantity: cartItem.qty,
                specialRequest: cartItem.specialRequest,
                totalPrice: receipt.total,
                sideProducts: cartItem.selectedSideProducts.map(sideProduct => {
                    return {
                        name: sideProduct.name,
                        sideProductId: sideProduct.id,
                        additionalCost: sideProduct.additionalCost,
                    }
                })
            }
        })



        //Payment intent amount needs to be the same amount as total of the cart being saved
        if (paymentInfo.amount !== Math.round(receipt.total * 100)) {
            ctx.response.status = 402;
            return { error: "The total payment is different from the payment intent" }
        }

        //create unqiue order id

        let orderId = orderid.generate();
        let uniqueOrderId = false;

        do {
            const foundOrderId = await strapi.query("order", pluginId).findOne({ orderId });
            if (!foundOrderId) {
                uniqueOrderId = true;
            } else {
                orderId = orderid.generate();
            }

        } while (!uniqueOrderId);




        //To add field to collection you need to define the property name define in the cms
        const entry = {
            paymentIntentId,
            orderId,
            charge: {
                taxes: receipt.taxes,
                total: receipt.total,
                subtotal: receipt.subtotal,
            },
            cart: orderCart,
            pickUpDate: formatedPickUpTime,
            customerDetails: contact,
        }


        let entity = await strapi.query('order', pluginId).create(entry);
        const entityCreated = entity.createdAt ? entity.createdAt : entity.created_at;
        const orderDate = moment(entityCreated).tz('America/New_York').format('lll');
        const updatedOrder = await strapi.query('order', pluginId).update({ id: entity.id }, { orderDate });


        return sanitizeEntity(updatedOrder, { model: plugin.models.order });
    },
    getOrder: async (ctx) => {
        const id = ctx.params.id;
        const plugin = strapi.plugins[pluginId];
        const order = await strapi.query('order', pluginId).findOne({ id });

        if (!order) {
            return ctx.throw(400, 'Cannot find order')
        }


        const sanitizedOrder = sanitizeEntity(order, { model: plugin.models.order });
        return {
            order: sanitizedOrder,
        }
    },
    getValidatedCart: async (ctx) => {
        const fakeCart = [{ productId: '3', qty: 1, selectedSideProducts: ['3'], specialRequest: "" }]
        //Get pickUpTime, serverCart
        const plugin = strapi.plugins[pluginId];
        const { cart, pickUpTime } = ctx.request.body;


        const newCart = await plugin.services.cart.getPopulatedValidCart({ cart, pickUpTime: pickUpTime });
        const { isCartsEqual, populatedCart, receipt, valid, errorMessages } = newCart



        return { cart: populatedCart, isCartsEqual, receipt, valid, errorMessage: errorMessages[0] || null, };
    }
}