#!/usr/bin/env node

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const { Config } = require('../../utils/classes/Config');

Config.set_project_root(process.cwd());
const CONFIG = new Config('/config/micro-pipeline.json').load();

const { Component } = require('../../utils/classes/Component');
const { parse_variables } = require('../../utils/templates');
const { TERMINAL_FORMATS } = require('../../utils/console');

const MAPPING = {
	'js': 'node',
	'javascript': 'node',
	'py': 'python'
};

const ENDINGS = {
	'python': 'py',
	'node': 'js'
};

const Builder = new Component({
	name: 'builder',

	create(entity, service_name, coding_language='node') {
		data = {
			name: _.snakeCase(service_name),
			class_name: _.startCase(_.camelCase(service_name)).replace(/ /g, ''),
			cwd: process.cwd()
		}
		coding_language = _.get(MAPPING, coding_language, coding_language)

		const render = _.template(fs.readFileSync(`./${CONFIG.PATHS.SERVICES}/blueprints/${coding_language}.${entity}`).toString());
		let file = render(data);

		const file_ending = ENDINGS[coding_language];
		let file_path = CONFIG.PATHS.SERVICES;
		
		if(entity === 'component') {
			file_path = CONFIG.PATHS.COMPONENTS;
		}
		file_path = path.join(file_path, `${data.name}.${file_ending}`);

		fs.writeFileSync(file_path, file);
		fs.chmodSync(file_path, '755');

		console.log(`Component created. Try it by running ${TERMINAL_FORMATS.WARNING}./${file_path} help${TERMINAL_FORMATS.RESET}`);
	}
});