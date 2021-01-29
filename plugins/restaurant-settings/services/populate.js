const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');


//==============================
//CATEGORY
//==============================

const populatedSanitizedCategory = async ({ id, pickUpTime }) => {

    const plugin = strapi.plugins[pluginId];
    const pluginFunctions = plugin.services;

    //Get category from plugin. Make sure we don't expose sensitive information
    const entity = await strapi.query('category', pluginId).findOne({ id });
    let sanitizedCategory = sanitizeEntity(entity, { model: plugin.models.category });

    //Add working hours to product
    // sanitizedCategory = await addCategoryHours(sanitizedCategory);

    //Populate each product in the category
    const categoryProducts = sanitizedCategory.products;
    const populatedCategoryProducts = await Promise.all(categoryProducts.map(async (product) => {
        const newProduct = await populatedSanitizedProduct({ id: product.id, pickUpTime });
        return newProduct;
    }))

    //Populate each product in the subcategories
    const subCategories = sanitizedCategory.subCategories;
    const newSubCategories = await Promise.all(subCategories.map(async subCategory => {
        const newSubCategory = subCategory;
        //Make sure to only update the products property of the subCategory data
        newSubCategory.products = await Promise.all(subCategory.products.map(async product => {
            const newProduct = await populatedSanitizedProduct({ id: product.id, pickUpTime });
            return newProduct;
        }))
        return newSubCategory;
    }))

    //Update category direct products and new subCatgories data
    sanitizedCategory.products = populatedCategoryProducts;
    sanitizedCategory.subCategories = newSubCategories;



    return sanitizedCategory;

}

//==============================
//PRODUCT
//==============================

const populatedSanitizedProduct = async ({ id, pickUpTime }) => {
    const plugin = strapi.plugins[pluginId];

    const entity = await strapi.query('product', pluginId).findOne({ id });
    let sanitizedProduct = sanitizeEntity(entity, { model: plugin.models.product });

    //Only add the hours for each category in product b/c we don't an infinite loop populated product populating categories and vice versa 
    const productCategories = sanitizedProduct.categories;;

    //update the new categories
    let product = { ...sanitizedProduct, categories: productCategories }


    return product;
}

//==============================
//SIDE PRODUCT
//==============================
const populatedSanitizedSideProduct = async ({ id, pickUpTime }) => {
    const plugin = strapi.plugins[pluginId];

    //Get all side products from plugin. Make sure we don't expose sensitive information
    const entity = await strapi.query('side-product', pluginId).findOne({ id });
    const sanitizedSideProduct = sanitizeEntity(entity, { model: plugin.models['side-product'] });

    //Populate each product that side-product is related to
    const productsWithSide = sanitizedSideProduct.products;
    const populatedProducts = await Promise.all(productsWithSide.map(async (product) => {
        const newProduct = await populatedSanitizedProduct({ id: product.id, pickUpTime });
        return newProduct;
    }))
    return { ...sanitizedSideProduct, products: populatedProducts }
}

module.exports = { populatedSanitizedCategory, populatedSanitizedProduct, populatedSanitizedSideProduct }