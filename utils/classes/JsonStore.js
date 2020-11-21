const _ = require('lodash');
const { load_json, save_json } = require('../jsons');

class JsonStore {
	changed = false;
	storage = {};
	path = '';

	constructor(path) {
		this.path = path;
		this.load(path);

		const self = new Proxy(this, this);
		return self;
	}

	load(path=false) { 
		this.set(this, 'path', path || this.path);
		this.clear();
		if(this.path && this.path.length) {
			this.set(this, 'storage', load_json(this.path, {}));
		}
		this.changed = false;
		return this;
	}

	save(path=false, storage=false, pretty=true) { 
		this.set(this, 'path', path || this.path);
		if(storage) {
			this.set(this, 'storage', storage);
		}
		if(this.path && this.path.length) {
			save_json(this.path, this.storage, pretty);
		}
		this.changed = false;
		return this;
	}

	clear() {
		this.set(this, 'storage', {});
		return this;
	}

	get(self, field) {
		const value = _.get(self, field);
		if(value) {
			return value;
		}
		return _.get(self.storage, field);
	}

	set(self, field, value) {
		if(_.get(self, field)) {
			_.set(self, field, value);
		} else {
			_.set(self.storage, field, value);
			this.changed = true;
		}
		return true;
	}

	toString() {
		return String(this.storage);
	}
};

module.exports = { JsonStore };