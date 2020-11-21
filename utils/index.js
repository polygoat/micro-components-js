require('colors');

const _error = console.error;
console.success = (...args) => console.log(args.join(' ').green);
console.error = (...args) => _error(args.join(' ').red);
console.respond = what => console.log(JSON.stringify(what, null, 4));