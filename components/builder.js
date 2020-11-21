#!/usr/bin/env node

require('colors');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');

const { Component } = require('../utils/classes/Component');

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
		const data = {
			name: _.snakeCase(service_name),
			class_name: _.startCase(_.camelCase(service_name)).replace(/ /g, ''),
			cwd: process.cwd()
		}
		coding_language = _.get(MAPPING, coding_language, coding_language);

		const render = _.template(fs.readFileSync(`./${coding_language}.${entity}`).toString());
		let file = render(data);

		const file_ending = ENDINGS[coding_language];
		let file_path = CONFIG.PATHS.SERVICES;
		
		if(entity === 'component') {
			file_path = CONFIG.PATHS.COMPONENTS;
		}
		file_path = path.join(file_path, `${data.name}.${file_ending}`);

		fs.writeFileSync(file_path, file);
		fs.chmodSync(file_path, '755');

		console.log(' Component created. Try it by running ' + './${file_path} help'.yellow);
	}
});

Builder.export_as_cli();