const _ = require('lodash');

const TERMINAL_FORMATS = {
    OK_BLUE: '[34m',
    INFO: '[36m',
    EXTRA: '[35m',
    SUCCESS: '[92m',
    WARNING: '[33m',
    FAIL: '[31m',
    SUCCESS_BANNER: '[42m[30m',
    FAIL_BANNER: '[101m[30m',
    BOLD: '[1m',
    UNDERLINE: '[4m',
    RESET: '[0m'
};

const nice_log = (messages, color='') => {
	if(color) {
		color = TERMINAL_FORMATS[color];
	}
    if(!_.isArray(messages)) {
        messages = [messages];
    }
    messages.push(TERMINAL_FORMATS.RESET);
	console.log(` ${color}`, ...messages);
}

const SUCCESS = { success: true };

module.exports = {
    SUCCESS,
    TERMINAL_FORMATS,
    nice_log
};