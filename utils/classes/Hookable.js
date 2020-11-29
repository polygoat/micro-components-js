class Hookable {
	hooks = {}

	static on(event_label, method) {
		if(!(event_label in Hookable.hooks)) {
			Hookable.hooks[event_label] = [];
		}
		Hookable.hooks[event_label].push(method);
	}

	on(event_label, method) {
		if(!this.hooks) {
			Object.defineProperty(this, 'hooks', {
				value: { [event_label]: [method] },
				configurable: false,
				enumerable: false,
				writable: true
			});
		} else {
			if(!(event_label in Hookable.hooks)) {
				this.hooks[event_label] = [];
			}
			this.hooks[event_label].push(method);
		}
	}

	static trigger(event_label, parameters, fallback=false) {
		if(!parameters) {
			parameters = [];
		}

		if(event_label in Hookable.hooks) {
			let result;
			Hookable.hooks[event_label].forEach((method) => {
				result = method(...parameters);
				parameters[0] = result;
			});
			return result;
		}
		return fallback;
	}

	trigger(event_label, parameters, fallback=false) {
		if(!parameters) {
			parameters = [];
		}

		if(event_label in (this.hooks || {})) {
			let result;
			this.hooks[event_label].forEach((method) => {
				result = method(...parameters);
				parameters[0] = result;
			});
			return result;
		}
		return fallback;
	}

}
Hookable.hooks = {};

module.exports = { Hookable };