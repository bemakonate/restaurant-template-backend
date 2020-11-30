const moment = require('moment');

const arrayEquals = (a, b) => {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function compare(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}


function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

const msToHHMM = (ms) => {
    const obj = moment.duration(ms)._data;
    if (obj.hours < 10) {
        obj.hours = '0' + obj.hours;
    }
    if (obj.minutes < 10) {
        obj.minutes = '0' + obj.minutes;
    }
    return `${obj.hours}:${obj.minutes}`;
}

const minsToMs = (mins) => mins * 60000;

const validateHhMm = (value) => {
    var isValid = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(value);
    return isValid;
}


//Get the dates/day between the two dates passed
const getDates = (startDate, endDate) => {
    const dates = [];
    let currentDate = startDate;

    do {
        dates.push(moment(currentDate).format('YYYY-MM-DD'));
        currentDate = new Date(new Date(currentDate).getTime() + 60000)

    } while (currentDate <= endDate);

    return Array.from(new Set(dates));
}

module.exports = {
    validateHhMm,
    arrayEquals,
    compare,
    isJson,
    msToHHMM,
    minsToMs,
    getDates
}