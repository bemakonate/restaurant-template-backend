const { arrayEquals, validateHhMm } = require('./helpers');
const { currentPossiblePickups, getOnlyPickUps } = require('./pickUp');
const pluginId = require("../admin/src/pluginId");
const { sanitizeEntity } = require('strapi-utils');
const moment = require('moment-business-time');

const pluginStore = () => strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'bemak-restaurant-settings'
})
const defaultWorkingHours = () => {
    return {
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null
    }
}

const isOpenForPickUp = ({ pickUpTime, hours }) => {
    const defaultWorkingHoursVar = {
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null
    }
    //1.define a moment locale for category hours
    const momentLocale = moment.updateLocale('en', {
        workinghours: JSON.parse(hours.open) || defaultWorkingHoursVar,
        holidays: JSON.parse(hours.closed),
    });

    //2.check to see if the category is available for pickupTime

    const momentPickUpTime = moment(pickUpTime || new Date().getTime());
    const isOpenForPickUp = momentPickUpTime.isWorkingTime();

    return isOpenForPickUp;
}

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
    }
    else {
        return {
            ...category,
            hours: {
                source: 'none',
                open: JSON.stringify(null),
                closed: JSON.stringify(null),
            }
        }
    }
}

const addProductHours = async (product) => {
    const productHours = await pluginStore().get({ key: `products.${product.id}.hours` });
    const businessHours = await pluginStore().get({ key: 'businessHours' });

    if (productHours && productHours.source === 'business') {
        return {
            ...product,
            hours: {
                source: productHours.source,
                open: JSON.stringify(businessHours.open),
                closed: JSON.stringify(businessHours.closed),
            }
        }
    }
    else if (productHours && productHours.source === 'custom') {
        return {
            ...product,
            hours: {
                source: productHours.source,
                open: JSON.stringify(productHours.hours),
                closed: JSON.stringify(null),
            }
        }
    }
    else if (productHours && productHours.source === 'none') {
        return {
            ...product,
            hours: {
                source: 'none',
                open: JSON.stringify(productHours.hours),
                closed: JSON.stringify(null),
            }
        }
    }
    else {
        return {
            ...product,
            hours: {
                source: 'categories',
                open: JSON.stringify(null),
                closed: JSON.stringify(null),
            }
        }
    }
}

const populatedSanitizedCategory = async ({ id, pickUpTime }) => {

    const plugin = strapi.plugins[pluginId];
    const entity = await strapi.query('category', pluginId).findOne({ id });
    let sanitizedCategory = sanitizeEntity(entity, { model: plugin.models.category });



    //add weekly hours to the products
    sanitizedCategory = await addCategoryHours(sanitizedCategory);

    //Populate each product 
    const categoryProducts = sanitizedCategory.products;


    const populatedCategoryProducts = await Promise.all(categoryProducts.map(async (product) => {
        const newProduct = await populatedSanitizedProduct({ id: product.id, pickUpTime });
        return newProduct;
    }))


    const subCategories = sanitizedCategory.subCategories;
    const newSubCategories = await Promise.all(subCategories.map(async subCategory => {
        const newSubCategory = subCategory;
        newSubCategory.products = await Promise.all(subCategory.products.map(async product => {
            const newProduct = await populatedSanitizedProduct({ id: product.id, pickUpTime });
            return newProduct;
        }))
        return newSubCategory;
    }))


    sanitizedCategory.isOpenForPickUp = isOpenForPickUp({ pickUpTime, hours: sanitizedCategory.hours });
    sanitizedCategory.subCategories = newSubCategories;
    sanitizedCategory.products = populatedCategoryProducts;

    return sanitizedCategory;

}

const populatedSanitizedProduct = async ({ id, pickUpTime }) => {
    const plugin = strapi.plugins[pluginId];
    const entity = await strapi.query('product', pluginId).findOne({ id });
    const sanitizedProduct = sanitizeEntity(entity, { model: plugin.models.product });
    //populate product
    const productCategories = sanitizedProduct.categories;
    const populatedProductCategories = await Promise.all(productCategories.map(async (productCategory) => {
        const updatedCategoryHour = await addCategoryHours(productCategory);
        return updatedCategoryHour;
    }));

    let product = { ...sanitizedProduct, categories: populatedProductCategories }
    product = await addProductHours(product);


    //calc isOpenForPickUp from categories
    let productOpenForPickUp = false;

    if (product.hours.source === 'categories') {
        product.categories.forEach(async (category) => {
            productOpenForPickUp = productOpenForPickUp || isOpenForPickUp({ hours: category.hours, pickUpTime });
        });
    }
    else {
        productOpenForPickUp = isOpenForPickUp({ hours: product.hours, pickUpTime });
    }


    product.isOpenForPickUp = productOpenForPickUp;


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
    addProductHours,
    currentPossiblePickups,
    defaultWorkingHours,
    getOnlyPickUps,
}