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

	create(component_name, coding_language='node') {
		const data = {
			name: _.snakeCase(component_name),
			class_name: _.startCase(_.camelCase(component_name)).replace(/ /g, ''),
			cwd: process.cwd()
		};
		coding_language = _.get(MAPPING, coding_language, coding_language);

		const render = _.template(fs.readFileSync(`./${coding_language}.component`).toString());
		let file = render(data);

		const file_ending = ENDINGS[coding_language];
		const file_path = `./${data.name}.${file_ending}`;

		fs.writeFileSync(file_path, file);
		fs.chmodSync(file_path, '755');

		console.log(' Component created.'.green + ' Try it by running ' + './${file_path} help'.yellow);
	}
});

Builder.export_as_cli();