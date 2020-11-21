const _ = require('lodash');
const shlex = require('shlex');
const { execSync } = require('child_process');

const shlex_join = parts => {
	parts = _.map(parts, shlex.quote);
	return parts.join(' ');
};

const shell_run = script => {
	const result = execSync(shlex_join(script)).toString().replace(/^\n+|\n+$/g, '');
	try {
		return JSON.parse(result);
	} catch(e) {
		return result;
	}
};

module.exports = { shell_run, shlex_join };