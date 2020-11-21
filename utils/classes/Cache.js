#!/usr/bin/env node

const _ = require('lodash');
const md5 = require('md5');
const path = require('path');
const { JsonStore } = require('../classes/JsonStore');
const { as_json } = require('../jsons');

class Cache extends JsonStore {
	constructor(path) {
		const self = super(path);
		process.on('exit', () => self.save(path));
	}

	clear() {
		super.clear();
		this.save();
	}

	save(path=false) {
		if(this.changed) {
			super.save(path, false, false);
		}
	}

	async fetch(key, computation) {
		const hash = this.hash(key);
		if(!(hash in this.storage)) {
			this[hash] = await computation();
		}
		return this[hash];
	}

	hash(value) {
		try {
			value = as_json(value);
		} catch(error) {
			value = value.toString();
		}
		return md5(value);
	}

	cli_output() {
		return `<Cache Util ${this.path}>`;
	}
}

module.exports = { Cache };