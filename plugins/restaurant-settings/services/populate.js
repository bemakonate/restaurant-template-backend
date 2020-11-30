const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

//==============================
//WORKING HOURS
//==============================

const populateWorkingHours = async ({ source, workingHours, entity, type }) => {
    const plugin = strapi.plugins[pluginId];
    const pluginStore = plugin.services.index.pluginStore();
    const businessHours = await pluginStore.get({ key: 'businessHours' });

    //If source is business hours return the current business hours
    if (workingHours && source === 'business') {
        return {
            ...entity,
            hours: {
                source: source,
                open: businessHours.open,
                closed: businessHours.closed,
            }
        }
    }
    //If source is custom return the workingHours of the entity
    else if (workingHours && source === 'custom') {
        return {
            ...entity,
            hours: {
                source: source,
                open: workingHours.open,
                closed: workingHours.closed,
            }
        }
    }
    //If not any source above, but is a product. The default value should be a category
    else if (type === 'product') {
        return {
            ...entity,
            hours: {
                source: 'categories',
                open: JSON.stringify(null),
                closed: JSON.stringify(null),
            }
        }
    }
    //If not any above make sure the value is none
    else {
        return {
            ...entity,
            hours: {
                source: 'none',
                open: JSON.stringify(null),
                closed: JSON.stringify(null),
            }
        }
    }


}
//==============================
//CATEGORY
//==============================

const addCategoryHours = async (category) => {
    const plugin = strapi.plugins[pluginId];
    const pluginStore = plugin.services.index.pluginStore();

    const categoryHours = await pluginStore.get({ key: `categories.${category.id}.hours` });

    //Get the new category with the working hours in correct format for api
    const newCategory = await plugin.services['populate'].populateWorkingHours({
        entity: category,
        workingHours: categoryHours,
        source: categoryHours.source
    });

    return newCategory;

}

const populatedSanitizedCategory = async ({ id, pickUpTime }) => {

    const plugin = strapi.plugins[pluginId];
    const pluginFunctions = plugin.services;

    //Get category from plugin. Make sure we don't expose sensitive information
    const entity = await strapi.query('category', pluginId).findOne({ id });
    let sanitizedCategory = sanitizeEntity(entity, { model: plugin.models.category });

    //Add working hours to product
    sanitizedCategory = await addCategoryHours(sanitizedCategory);

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

    //API show if the category is open for pickup
    sanitizedCategory.isOpenForPickUp = pluginFunctions['working-hours'].isOpenForPickUp({ pickUpTime, hours: sanitizedCategory.hours });


    return sanitizedCategory;

}

//==============================
//PRODUCT
//==============================

const addProductHours = async (product) => {
    const plugin = strapi.plugins[pluginId];
    const pluginStore = plugin.services.index.pluginStore();
    const productHours = await pluginStore.get({ key: `products.${product.id}.hours` });

    //Get the new product with the working hours in correct format for api
    const newProduct = await plugin.services['populate'].populateWorkingHours({
        type: 'product',
        entity: product,
        workingHours: productHours,
        source: productHours ? productHours.source : null,
    });

    return newProduct;
}

const populatedSanitizedProduct = async ({ id, pickUpTime }) => {
    const plugin = strapi.plugins[pluginId];
    const pluginFunctions = plugin.services;

    const entity = await strapi.query('product', pluginId).findOne({ id });
    let sanitizedProduct = sanitizeEntity(entity, { model: plugin.models.product });

    //Add the product hours
    sanitizedProduct = await addProductHours(sanitizedProduct);

    //Only add the hours for each category in product b/c we don't an infinite loop populated product populating categories and vice versa 
    const productCategories = sanitizedProduct.categories;
    const populatedProductCategories = await Promise.all(productCategories.map(async (productCategory) => {
        const updatedCategory = await addCategoryHours(productCategory);
        return updatedCategory;
    }));

    //update the new categories
    let product = { ...sanitizedProduct, categories: populatedProductCategories }

    let productOpenForPickUp = false;

    //If product hour source is categories then loop through each product, you only need to have one category open for product to be openForPickUp
    if (product.hours.source === 'categories') {
        product.categories.forEach(async (category) => {
            productOpenForPickUp = productOpenForPickUp || pluginFunctions['working-hours'].isOpenForPickUp({ hours: category.hours, pickUpTime });
        });
    }
    else {
        //Use the product hours to see if product is open for pick up
        productOpenForPickUp = pluginFunctions['working-hours'].isOpenForPickUp({ hours: product.hours, pickUpTime });
    }


    product.isOpenForPickUp = productOpenForPickUp;


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

module.exports = { populateWorkingHours, populatedSanitizedCategory, populatedSanitizedProduct, populatedSanitizedSideProduct }