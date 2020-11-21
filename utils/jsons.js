const fs = require('fs');

const as_json = (obj, pretty=true) => JSON.stringify(obj, null, pretty ? 4 : null);
const load_json = (path, fallback=false) => {
	if(fs.existsSync(path)) {
		return JSON.parse(fs.readFileSync(path).toString());
	}
	return fallback || {
		error: `Could not find ${path}`
	};
};
const save_json = (path, obj, pretty=true) => fs.writeFileSync(path, JSON.stringify(obj, null, pretty ? 4 : null));

module.exports = { as_json, load_json, save_json };