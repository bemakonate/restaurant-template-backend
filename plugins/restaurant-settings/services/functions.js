const { arrayEquals, validateHhMm } = require('./helpers');
const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');

const pluginStore = () => strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'bemak-restaurant-settings'
})

const addCategoryHours = async (category) => {

    const categoryHours = await pluginStore().get({ key: `categories.${category.id}.hours` });
    const businessHours = await pluginStore().get({ key: 'businessHours' });

    if (categoryHours && categoryHours.source === 'business') {
        return {
            ...category,
            hours: {
                source: categoryHours.source,
                open: JSON.stringify(businessHours.open),
                closed: JSON.stringify(businessHours.closed),
            }
        }
    }
    else if (categoryHours && categoryHours.source === 'custom') {
        return {
            ...category,
            hours: {
                source: categoryHours.source,
                open: JSON.stringify(categoryHours.hours),
                closed: JSON.stringify(null),
            }
        }

    } else {
        return {
            ...category,
            hours: {
                source: categoryHours.source,
                open: JSON.stringify(null),
                closed: JSON.stringify(null),
            }
        }
    }


}

const populatedSanitizedCategory = async (id) => {
    const plugin = strapi.plugins[pluginId];
    const entity = await strapi.query('category', pluginId).findOne({ id });
    let sanitizedCategory = sanitizeEntity(entity, { model: plugin.models.category });

    sanitizedCategory = await addCategoryHours(sanitizedCategory);

    const categoryProducts = sanitizedCategory.products;
    const populatedCategoryProducts = await Promise.all(categoryProducts.map(async (product) => {
        const newProduct = await populatedSanitizedProduct(product.id);
        return newProduct;
    }))


    return { ...sanitizedCategory, products: populatedCategoryProducts };

}

const populatedSanitizedProduct = async (id) => {
    const plugin = strapi.plugins[pluginId];
    const entity = await strapi.query('product', pluginId).findOne({ id });
    const sanitizedProduct = sanitizeEntity(entity, { model: plugin.models.product });
    const productCategories = sanitizedProduct.categories;
    const populatedProductCategories = await Promise.all(productCategories.map(async (productCategory) => {
        const updatedCategoryHour = await addCategoryHours(productCategory);
        return updatedCategoryHour;
    }));

    const product = { ...sanitizedProduct, categories: populatedProductCategories }
    return product;
}


const populatedSanitizedSideProduct = async (id) => {
    const plugin = strapi.plugins[pluginId];
    const entity = await strapi.query('side-product', pluginId).findOne({ id });
    const sanitizedSideProduct = sanitizeEntity(entity, { model: plugin.models['side-product'] });

    const productsWithSide = sanitizedSideProduct.products;
    const populatedProducts = await Promise.all(productsWithSide.map(async (product) => {
        const newProduct = await populatedSanitizedProduct(product.id);
        return newProduct;
    }))
    return { ...sanitizedSideProduct, products: populatedProducts }
}

const validateWeeklyHours = (businessHours) => {
    const isDayHoursValid = (dayHours) => {
        let isDayHoursValid = true;
        //If value is an array
        if (Array.isArray(dayHours)) {
            //make sure number of hours are even
            if (dayHours.length % 2 !== 0) {
                isDayHoursValid = false;
            }
            //check to make sure each item in the array is a string and is not not empty
            dayHours.forEach(slotHour => {
                isDayHoursValid = isDayHoursValid && validateHhMm(slotHour);
            })
        }
        //If not an array
        else {
            //Make sure that the value is null
            isDayHoursValid = isDayHoursValid && (dayHours === null)
        }

        return isDayHoursValid;
    }
    //Make sure that their are seven days of the week (next line)
    //1. For in loop each object key and at it to an array
    const correctDaysOfTheWeek = [0, 1, 2, 3, 4, 5, 6];
    let givenDaysOfTheWeek = [];

    for (const dayIndex in businessHours) {
        givenDaysOfTheWeek.push(Number(dayIndex));
    }

    //2. Sort the array 
    givenDaysOfTheWeek = givenDaysOfTheWeek.sort((a, b) => a - b);
    //3. Make sure the given businessHours days array === [0,1,2,3,4,5,6]
    const isDaysOfWeekValid = arrayEquals(correctDaysOfTheWeek, givenDaysOfTheWeek);

    //4.If days of week not valid return error
    if (!isDaysOfWeekValid) {
        return {
            valid: false,
            error: {
                message: 'Days of the week are not correct'
            }
        }
    }

    const dayHoursValidity = [];

    //For loop through each day of the week
    for (const dayIndex in businessHours) {
        const dayHours = businessHours[dayIndex];
        const dayHoursValid = isDayHoursValid(dayHours);
        dayHoursValidity.push(dayHoursValid);
    }

    let isAllHoursValid = true;
    dayHoursValidity.forEach(isDayHourValid => {
        isAllHoursValid = isAllHoursValid && isDayHourValid;
    })


    if (isAllHoursValid) {
        return {
            valid: true,
            error: null,
        }
    } else {
        return {
            valid: false,
            error: {
                message: 'One or more hours given is invalid'
            }
        }
    }

}

module.exports = {
    pluginStore,
    addCategoryHours,
    validateWeeklyHours,
    populatedSanitizedProduct,
    populatedSanitizedSideProduct,
    populatedSanitizedCategory,
}