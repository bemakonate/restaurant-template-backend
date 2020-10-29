const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');
const uninitializedStripe = require('stripe');
const orderid = require('order-id')(process.env.ORDER_ID_SECRET);
const moment = require('moment-timezone');

module.exports = {
    setUpStripe: async (ctx) => {
        //Through ctx.request.body we will receive the products and the quantity

        //Only take the id of each product
        const { cart } = ctx.request.body;
        let reciptCart = []; //Because stripe wants less than 500 char

        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.functions.pluginStore();

        const { stripePKSecret } = await pluginStore.get({ key: 'secrets' })
        const stripe = uninitializedStripe(stripePKSecret);

        const validatedCart = await plugin.services.cart.validateCart({
            cart,
            cartItemCb: ({ foundProduct, cartItem }) => {
                reciptCart.push({ id: foundProduct.id, qty: cartItem.qty });
            }
        });


        const subtotal = plugin.services.cart.cartSubtotal(validatedCart);
        const total = plugin.services.cart.cartTotal(validatedCart);
        const taxes = plugin.services.cart.cartTaxes(validatedCart);



        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(total * 100),
                currency: 'usd',
                payment_method_types: ['card'],
                metadata: { validatedCart: JSON.stringify(reciptCart) }
            });

            return {
                summary: {
                    total,
                    taxes,
                    subtotal,
                },
                paymentIntent
            }
        } catch (err) {
            return { error: err.raw.message }
        }
    },
    createOrder: async (ctx) => {
        const {
            paymentIntent,
            cart,
            contact
        } = ctx.request.body;


        const plugin = strapi.plugins[pluginId];
        const pluginStore = plugin.services.functions.pluginStore();

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


        //check if the data is proper
        const orderCart = [];
        const sanitizedCart = await plugin.services.cart.validateCart({
            cart,
            cartItemCb: ({ foundProduct, cartItem, foundSideProducts }) => {
                orderCart.push({
                    productName: foundProduct.name,
                    productPrice: foundProduct.price,
                    productId: foundProduct.id,
                    productQuantity: cartItem.qty,
                    specialRequest: cartItem.specialRequest,
                    totalPrice: (foundProduct.price * cartItem.qty).toFixed(2),
                    sideProducts: foundSideProducts.map(sideProduct => {
                        return {
                            name: sideProduct.name,
                            sideProductId: sideProduct.id,
                            additionalCost: sideProduct.additionalCost,
                        }
                    })

                })
            }
        })

        const orderTotal = plugin.services.cart.cartTotal(sanitizedCart);
        const orderTaxes = plugin.services.cart.cartTaxes(sanitizedCart);
        const orderSubtotal = plugin.services.cart.cartSubtotal(sanitizedCart);



        //Payment intent amount needs to be the same amount as total of the cart being saved
        if (paymentInfo.amount !== Math.round(orderTotal * 100)) {
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
                taxes: orderTaxes,
                total: orderTotal,
                subtotal: orderSubtotal,
            },
            cart: orderCart,
            customerDetails: contact,
        }


        let entity = await strapi.query('order', pluginId).create(entry);
        const entityCreated = entity.createdAt ? entity.createdAt : entity.created_at;
        const orderDate = moment(entityCreated).tz('America/New_York').format('lll');
        const updatedOrder = await strapi.query('order', pluginId).update({ id: entity.id }, { orderDate });


        return sanitizeEntity(updatedOrder, { model: plugin.models.order });
    }
}