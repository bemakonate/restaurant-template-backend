'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const getAllProducts = (subCategories) => {
    const allProducts = [];
    (subCategories.length > 0) && subCategories.forEach(subCategory => {
        (subCategory.products) && subCategory.products.forEach(subCategoryProduct => {
            allProducts.push(subCategoryProduct);
        })
    })

    return [...new Set(allProducts)];

}

module.exports = {
    lifecycles: {
        // beforeUpdate(params, data) {
        //     const newProducts = getAllProducts(data.subCategories);
        //     data.products = newProducts

        // },
        // beforeCreate(data) {
        //     const newProducts = getAllProducts(data.subCategories);
        //     data.products = newProducts;
        // }
    }

};
