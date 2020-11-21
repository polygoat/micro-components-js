const { TERMINAL_FORMATS } = require('./console');

const _error = console.error;
console.success = (...args) => console.log(TERMINAL_FORMATS.SUCCESS, ...args, TERMINAL_FORMATS.RESET);
console.error = (...args) => _error(TERMINAL_FORMATS.FAIL, ...args, TERMINAL_FORMATS.RESET);
console.respond = what => console.log(JSON.stringify(what, null, 4));