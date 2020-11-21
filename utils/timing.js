const _ = require('lodash');
const any = require('promise.any');
const { JsonStore } = require('./classes/JsonStore');

const get_timestamp = () => +new Date;

const get_age = (timestamp, unit='seconds') => {
    const units = {
        ms: 1,
        seconds: 1000,
        minutes: 60000,
        hours: 3600000
    };
    const diff = get_timestamp() - timestamp;
    return diff / units[unit];
}

const timestamp_to_date = (timestamp) => {
    timestamp = timestamp || get_timestamp();
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = "0" + (date.getMonth()+1);
    const day = "0" + date.getDate();
    return year + '-' + month.substr(-2) + '-' + day.substr(-2);
}

const with_timeout = (promise, duration, default_value={}) => {
    let _timeout = false;

    const promised_timeout = new Promise(resolve => _timeout = setTimeout(resolve, duration, default_value));
    const promised_action = new Promise(async resolve => {
        const result = await promise;
        clearTimeout(_timeout);
        resolve(result);
    });
    const promises = [promised_action, promised_timeout];
    return any(promises);
}

module.exports = { get_timestamp, get_age, timestamp_to_date, with_timeout};