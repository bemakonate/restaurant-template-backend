const pluginId = require("../admin/src/pluginId");

const TAX_RATE = process.env.TAX_RATE || .01;
// const FREE_SHIPPING_THRESHOLD = process.env.FREE_SHIPPING_THRESHOLD || 100;
// const SHIPPING_RATE = process.env.SHIPPING_RATE || 0;

const cartSubtotal = (cart) => {

    let subtotal = cart.reduce((counter, cartItem) => {
        let cartItemTotal = cartItem.product.price * cartItem.qty;
        cartItem.selectedSideProducts.forEach(selectedSideProduct => {
            if (selectedSideProduct && selectedSideProduct.additionalCost) {
                cartItemTotal += selectedSideProduct.additionalCost;
            }
        })

        return counter + cartItemTotal;
    }, 0)

    subtotal = subtotal.toFixed(2)
    return subtotal;
}

const cartTaxes = (cart) => {
    const subtotal = cartSubtotal(cart);
    let tax = subtotal * TAX_RATE;
    tax = tax.toFixed(2)
    return tax;
}

const cartTotal = (cart) => {
    const subtotal = cartSubtotal(cart);
    const taxes = cartTaxes(cart);
    let total = Number(subtotal) + Number(taxes);

    total = Number(total).toFixed(2);
    return total;
}


const getPopulatedValidCart = async ({ cart, pickUpTime = 'null' }) => {
    const plugin = strapi.plugins[pluginId];
    const pluginStore = plugin.services.index.pluginStore();

    let newCart = [];
    let isCartsEqual = true;
    let isCartValid = true;
    const errorMessages = [];

    if (cart && cart.length > 0 && Array.isArray(cart)) {
        await Promise.all(cart.map(async (cartItem) => {
            try {
                const foundProduct = await plugin.controllers.products.getProduct({
                    params: { id: cartItem.productId },
                    query: { _pickUpTime: pickUpTime },
                });

                if (!foundProduct.isOpenForPickUp) {
                    isCartsEqual = false;
                    errorMessages.push("There was a change within the database and your cart. Check to make sure you are okay with your cart")
                    return null;
                }
                const foundSelectedSideProducts = cartItem.selectedSideProducts ? cartItem.selectedSideProducts.map(sideProduct => {
                    const selectedSideProduct = foundProduct.sideProducts.find(foundSideProduct => foundSideProduct.id === Number(sideProduct));
                    if (!selectedSideProduct) {
                        isCartsEqual = false;
                        isCartValid = false;
                        errorMessages.push("There was a change within the database and your cart. Check to make sure you are okay with your cart")
                    }
                    return selectedSideProduct;
                }) : null;

                newCart.push({
                    product: foundProduct,
                    qty: cartItem.qty,
                    selectedSideProducts: foundSelectedSideProducts,
                    specialRequest: cartItem.specialRequest,
                })

            } catch (err) {
                isCartsEqual = false;
                errorMessages.push("There was an error")
            }
        }))

        newCart = newCart.map((cartItem, index) => {
            return { ...cartItem, cartIndex: index }
        })

    }

    //Populate the serverCart
    //If cart was altered return true else false
    //Return the receipt information (total, subtotal, taxes)
    const receipt = plugin.services.cart.getCartReceipt({ cart: newCart });

    if (newCart.length <= 0) {
        isCartValid = false;
        errorMessages.push("All items in your cart are no longer considered valid")
    }

    const businessData = await pluginStore.get({ key: 'business' });
    if (receipt.total < businessData.ordering.minimumPayment) {
        isCartValid = false;
        errorMessages.push(`You have not met the minimum purchase of $${businessData.ordering.minimumPayment.toFixed(2)}`)
    }


    return { populatedCart: newCart, isCartsEqual, receipt, valid: isCartValid, errorMessages };
}

const getCartReceipt = ({ cart }) => {
    const plugin = strapi.plugins[pluginId];
    const subtotal = plugin.services.cart.cartSubtotal(cart);
    const total = plugin.services.cart.cartTotal(cart);
    const taxes = plugin.services.cart.cartTaxes(cart);

    const receipt = { subtotal, taxes, total };

    return receipt;
}

module.exports = {
    cartSubtotal,
    cartTaxes,
    cartTotal,
    getPopulatedValidCart,
    getCartReceipt
}