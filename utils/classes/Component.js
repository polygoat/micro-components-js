#!/usr/bin/env node

const _ = require('lodash');
const path = require('path');

require('../');
const { Cache } = require('./Cache');
const { Hookable } = require('./Hookable');

const { as_json } = require('../jsons');
const { shell_run } = require('../shell');
const { string_to_any } = require('../formats');
const { inspect_function, named_args_as_positional } = require('../funcs');

const ENGINES = {
	py:   'python',
	js:   'node',
	sh:   'shell',
	java: 'java'
};

const has_named_args = args => /(^| )\-\-\w+/g.test(args.join(' '));

class Component extends Hookable {
	name = ''
	engine = 'node'
	called_from_cli = false

	static registered = []

	constructor(options, extras=undefined) {
		super();

		this.init(options);
		Component.registered.push(this);

		if(this.is_cached) {
			if(!this.cached_methods) {
				this.cached_methods = _.filter(Object.getOwnPropertyNames(this), prop => !prop.startsWith('__') && _.isFunction(this[prop]));
			}
		}

		if(this.cached_methods) {
			this.init_cache();
			_.each(this.cached_methods, this.cache_method.bind(this));
		}

		Component.trigger('spawn', [this]);
		return this.trigger('spawn', [this], this);
	}

	static from_cli(path, extras=undefined) {
		return new ComponentCLI(path, extras);
	}

	async init(options) {
		if(_.isString(options)) {
			options = JSON.parse(options);
		}
		_.each(options, (value, key) => _.set(this, key, value));

		Component.trigger('init', [options]);
		this.trigger('init', [this, options]);

		return this;
	}

	init_cache() {
		if(!this.cache) {
			this.cache = new Cache(`./data/caches/${this.name}.cache.json`);
			this.clear_cache = () => {
				this.cache.clear();
				this.cache.save();
				return true;
			};
		}
	}

	cache_function(fn, fn_name=false) {
		fn_name = fn_name || fn.name;
		return async (...args) => {
			const key = [fn_name, ...args];
			Component.trigger('cache', [key]);
			return await this.cache.fetch(key, async() => await fn(...args));
		};
	}

	cache_method(method_name) {
		const method = this[method_name];
		this[method_name] = this.cache_function(method, method_name);
		this[method_name].redirect = method;
	}

	omit_from_help(method) {
		method.omit_from_help = true;
		return method;
	}

	help() {
		const component_props = ['name', 'hooks', 'called_from_cli', ...Object.getOwnPropertyNames(Component.prototype)];

		let callables = [];
		let props = [];

		let dir = Object.getOwnPropertyNames(this);
		dir = _.without(dir, ...component_props);

		_.each(dir, prop => {
			if(!prop.startsWith('on_')) {				
				let attribute = this[prop];
				const entry = { name: prop };

				if(_.isFunction(attribute)) {
					let params = inspect_function(attribute).parameters;
					
					params = _.map(params, param => {
						if(_.isUndefined(param.defaultValue)) {
							return param.parameter;
						}
						//return `${param.parameter}=${param.defaultValue}`;
						return param.parameter + `=${param.defaultValue}`.grey;
					});
					entry['params'] = params.join(', ');
					callables.push(entry);
				} else {
					if(attribute.cli_output) {
						entry['value'] = attribute.cli_output();
					} else {
						entry['value'] = as_json(attribute);
					}
					props.push(entry);
				}
			}
		});

		console.log(` ${_.startCase(this.name)} Component`.bold);
		if(this.description) {
			console.log(' ' + this.description + '\n');
		}

		if(callables.length) {
			console.log('\t' + 'Available methods:'.underline + '\n');
			_.map(callables, method => console.log(`\t\t.${method.name}`+ '('.yellow + method.params + ')'.yellow));
		}

		if(props.length) {
			const indent = prop => prop.replace(/\n/g, '\n\t\t');
			console.log('\n\t' + 'Available properties:'.underline + '\n');
			_.map(props, prop => console.log(`\t\t.${prop.name} ` + `(default ${indent(prop.value)})`.grey));
		}
	}

	async ['['](...args) {
		let commands = [...args];
		let next_comma_pos = commands.indexOf(',');
		let entire_log = [];
		let i = 0;

		if(_.last(commands) === ']') {
			commands.pop();
		}

		while(commands.length) {
			entire_log[i] = '';
			if(next_comma_pos === -1) {
				next_comma_pos = commands.length + 1;
			}

			const command = commands.shift();
			const params = commands.slice(0, next_comma_pos - 1);
			commands = commands.slice(next_comma_pos);

			const console_log = console.log;
			console.log = (...output) => entire_log[i] += output.join(' ') + '\n';
			await this.call_from_cli(command, params);
			console.log = console_log;

			entire_log[i] = entire_log[i].trim();
			next_comma_pos = commands.indexOf(',');
			i++;
		}
		return { results: entire_log };
	}

	get(prop) {
		return _.get(this, prop);
	}

	set(prop, value) {
		_.set(this, prop, value);
		return true;
	}

	static get_classname(component_name=false) {
		return _.upperFirst(_.camelCase(component_name));
	}

	get_classname(component_name=false) {
		return _.upperFirst(_.camelCase(component_name || this.name));
	}

	async call_from_cli(command, args, verbose=true) {
		Component.trigger('call_from_cli', [command, args, verbose]);

		if(command) {
			let result = false;
			const method = this[command];

			if(method) {
				const method_inspection = inspect_function(method);
				const params = method_inspection.parameters || [];

				if(has_named_args(args)) {
					const named = named_args_as_positional(args, method_inspection, this.name, command);
					args = named.args;
					await this.init(named.properties);
				}

				const is_consuming_rest = _.last(params) && _.last(params).isRestParameter;

				if(!is_consuming_rest && args.length > params.length) {
					result = { error: `Wrong number of arguments passed to ${command}: expected ${params.length} instead of ${args.length}.`};
				} else {					
					args = _.map(args, string_to_any);

					this.called_from_cli = true;
					method.as_cli = true;
					result = await this[command](...args);
				}
			} else {
				result = { error: `${this.name} has no method ${command}.`};
			}

			if(verbose) {
				if(result) {
					console.respond(result);
				}
			} else {
				return result;
			}
		}
	}

	async export_as_cli() {
		const name = path.basename(require.main.filename).replace(/\.js$/g, '');
		const is_imported = name !== this.name;

		if(!is_imported) {
			this.trigger('spawn', [this]);
			let [command, ...args] = process.argv.slice(2);
			await this.call_from_cli(command, args, true);
			this.export_as_cli = _.noop;
		}
		return this;
	}

	export_as_(parent_module) {
		if(!_.has(parent_module, 'exports')) {
			parent_module.exports = {};
		}
		parent_module.exports[this.get_classname()] = this;
		return this;
	}

	export(module) {
		this.export_as_cli();
		this.export_as_(module);
		return this;
	}
}

class ComponentCLIProp extends Function {
	constructor(name, parent) {
		super('...args', 'return this.__self__.__call__(...args)');
	    let self = this.bind(this);
	    this.__self__ = self;
		self.prop_name = name;
		self.parent = parent;
		self.value = false;
		return self;
	}

	get() {
		const param = this.prop_name + ''
		this.prop_name = 'get';
		this.value = this.__call__(param);
		return String(this.value);
	}

	__call__(...params) {
		params = _.map(params, param => {
			if(_.isArray(param) || _.isPlainObject(param)) {
				param = as_json(param, false);
			}
			return param;
		});

		const command = [`./${this.parent.path}`, this.prop_name, ...params];

		if(this.parent.is_cached) {
			return this.parent.cache.fetch(command, () => shell_run(command));
		}

		let result = shell_run(command);
		result = string_to_any(result);
		return result;
	}
}

class ComponentCLI extends Hookable {
	constructor(name, options={}) {
		super();
		this.path = name;
		const engine = ENGINES[path.extname(this.path).slice(1)];

		name = path.basename(name).replace(/\.[^\.]+$/, '');
		this.name = name;
		this.engine = engine;
		this.__component = new Component({ name, engine });
		this.format = name.match(/[^\.]+$/)[0];
		this.is_cached = _.get(options, 'cached', false);
		this.cache = new Cache(`data/caches/${name}.cache.json`);

		const self = new Proxy(this, this);

		return { [this.__component.get_classname()]: self };
	}

	init(options) {
		this.__component.init(options);
	}

	get(self, name) {
		if(name in this) {
			return this[name];
		}
		return new ComponentCLIProp(name, this);
	}
}

module.exports = { Component };