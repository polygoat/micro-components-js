require('colors');
const fs = require('fs');
const _ = require('lodash');
const { shell_run } = require('../utils/shell');
const { get_datatype } = require('../utils/funcs');
const { Component } = require('../utils/classes/Component');

describe('Component JS class', () => {
	test('Component class instantiation', () => {
		const { Builder } = require('../components/builder');
		expect(get_datatype(Builder.create)).toBe('Function');
	});

	test('Help helper', () => {
		const result = shell_run(['./components/builder.js', 'help']);

		expect(result).toEqual( expect.stringContaining('Available methods') );
		expect(result).toEqual( expect.stringContaining('Available properties') );
		expect(result).toEqual( expect.stringContaining('.create') );
		expect(result).toEqual( expect.stringContaining('component_name') );
		expect(result).toEqual( expect.stringContaining('.engine') );
	});

	test('Method help helper', () => {
		const result = shell_run(['./components/builder.js', 'create', '--help']);

		expect(result).toEqual( expect.stringContaining('positional arguments:') );
		expect(result).toEqual( expect.stringContaining('component_name_pos') );
		expect(result).toEqual( expect.stringContaining('optional arguments:') );
		expect(result).toEqual( expect.stringContaining('--component_name [COMPONENT_NAME]') );
	})
});

describe('Component interaction', () => {
	test('Node <---> bash', () => {		
		shell_run(['micro-components', 'create', 'receiver']);
		let js_lines = fs.readFileSync('./receiver.js').toString().split('\n');
		fs.writeFileSync('./broker.sh', `echo '{ "hello": "world" }'`);
		fs.chmodSync('./broker.sh', '755');

		js_lines[2] = js_lines[2].replace('micro-components-js', './')
		js_lines.splice(3, 0, "const { Broker } = Component.from_cli('./broker.sh');");
		js_lines.splice(8, 0, '\trun: key => Broker.anything()[key],');

		fs.writeFileSync('./receiver.js', js_lines.join('\n'));

		const result = shell_run(['./receiver.js', 'run', 'hello']);
		expect(result).toBe('world');

		fs.unlinkSync('./receiver.js');
		fs.unlinkSync('./broker.sh');
	});
});

describe('Component Builder', () => {
	test('Component creation', () => {
		const result = shell_run(['micro-components', 'create', "My Component", '--color=false']);
		expect(result).toBe('Component created. Try it by running ./my_component.js help');

		const { MyComponent } = require('../my_component');
		expect(MyComponent instanceof Component).toBe(true);
		expect(MyComponent.name).toBe('my_component');

		fs.unlinkSync('./my_component.js');
	});
});