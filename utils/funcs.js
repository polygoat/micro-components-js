const _ = require('lodash');
const inspect = require('inspect-function');

const get_datatype = (obj) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1];
const inspect_function = (fn) => {
	if(fn.redirect) {
		fn = fn.redirect;
	}
	const signature = inspect(fn);
	_.each(signature.parametersNames, parameter => {
		if(_.has(parameter, 'defaultValue')) {
			let datatype;

			try {
				const parsed = eval(parameter.defaultValue);
				datatype = eval(get_datatype(parsed));
			} catch(error) {
				datatype = String;
			}
			_.set(parameter, 'datatype', datatype);
		}
	});
	return signature;
};

const named_args_as_positional = (args, inspection, service_name, method_name) => {
	const argparse = require('argparse');
	const arg_list = inspection.parametersNames.join('> <');
	let description = _.startCase(service_name) + ` Component: ${method_name} <${arg_list}>`;
	const args_parser = new argparse.ArgumentParser({ usage: `./${service_name}.js ${method_name}`, description });
	
	_.each(inspection.parameters, definition => {
		const options = { nargs: '?' };
		let key = definition.parameter;

		if(!_.isUndefined(definition.defaultValue)) {
			options.help = `(default: ${definition.defaultValue})`;
		}

		if(definition.isRestParameter) {
		 	options.nargs = '*';
		}

		args_parser.add_argument(key + '_pos', options);
		args_parser.add_argument('--' + key, options );

	});


	const [ named_args, unknown_args ] = args_parser.parse_known_args(args);
	args = [];

	_.each(inspection.parameters, definition => {
		const name = definition.parameter;
		let value = _.get(named_args, name);
		if(_.isUndefined(value)) {
			value = _.get(named_args, name + '_pos');
		}
		if(definition.isRestParameter) {
			args = [...args, ...unknown_args];
		} else {
			args.push(value);
		}
	});

	const props_parser = new argparse.ArgumentParser();
	const properties = {};

	_.each(unknown_args, arg => {
		if(arg.startsWith('--')) {
			let [ arg_name, value ] = arg.slice(2).trim().split(/\s*=\s*/);
			properties[arg_name] = value.trim();
			args = _.without(args, arg);
		}
	});

	while(_.isUndefined(_.last(args)) && args.length) {
		args.pop();
	}
	return { args, properties };
};

module.exports = { 
	get_datatype, 
	inspect_function, 
	named_args_as_positional 
};