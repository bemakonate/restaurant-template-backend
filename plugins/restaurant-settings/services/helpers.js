
const validateHhMm = (value) => {
    var isValid = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(value);
    return isValid;
}

const arrayEquals = (a, b) => {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function compare(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}



module.exports = {
    validateHhMm,
    arrayEquals,
    compare
}