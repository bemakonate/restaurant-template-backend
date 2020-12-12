const pluginId = require("../admin/src/pluginId");

const TAX_RATE = process.env.TAX_RATE || .01;
// const FREE_SHIPPING_THRESHOLD = process.env.FREE_SHIPPING_THRESHOLD || 100;
// const SHIPPING_RATE = process.env.SHIPPING_RATE || 0;

const cartSubtotal = (cart) => {

    let subtotal = cart.reduce((counter, cartItem) => {
        let cartItemTotal = cartItem.product.price * cartItem.qty;
        cartItem.selectedSideProducts.forEach(selectedSideProduct => {
            if (selectedSideProduct.additionalCost) {
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

const validateCart = async ({ cart, cartItemCb, pickUpTime = Date.now() }) => {
    let validatedCart = [];
    const plugin = strapi.plugins[pluginId];

    await Promise.all(cart.map(async (cartItem) => {
        const validatedProduct = await plugin.services.populate.populatedSanitizedProduct({ id: cartItem.productId, pickUpTime });
        const validatedSideProducts = [];

        if (validatedProduct && cartItem.selectedSideProducts) {
            await Promise.all(cartItem.selectedSideProducts.map(async (selectedSideProduct) => {
                const validatedSideProduct = validatedProduct.sideProducts.find(sideProduct => sideProduct.id.toString() === selectedSideProduct.toString());
                if (validatedSideProduct) {
                    validatedSideProducts.push(validatedSideProduct);
                }
            }))
        }

        if (cartItemCb) {
            cartItemCb({ foundProduct: validatedProduct, cartItem, foundSideProducts: validatedSideProducts });
        }

        validatedCart.push({
            product: validatedProduct,
            qty: cartItem.qty,
            specialRequest: cartItem.specialRequest,
            selectedSideProducts: validatedSideProducts,
        })
        return null;
    }))


    return validatedCart;
}


module.exports = {
    cartSubtotal,
    cartTaxes,
    cartTotal,
    validateCart,
}