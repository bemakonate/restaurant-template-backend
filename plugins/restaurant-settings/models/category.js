'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

const validSubCategoriesProducts = (subCategories, allProducts) => {
    const newSubCategories = subCategories.map(subCategory => {
        const newSubCategoryProducts = subCategory.products.filter(subCategoryProduct => {
            const belongsToCategory = allProducts ? allProducts.find(product => product === subCategoryProduct) : false;
            return belongsToCategory;
        })
        return { ...subCategory, products: newSubCategoryProducts }
    })
    return newSubCategories;
}

module.exports = {
    lifecycles: {
        beforeUpdate(params, data) {
            const newSubCategories = validSubCategoriesProducts(data.subCategories, data.products);
            data.subCategories = newSubCategories;

        },
        beforeCreate(data) {
            const newSubCategories = validSubCategoriesProducts(data.subCategories, data.products);
            data.subCategories = newSubCategories;
        }
    }

};
