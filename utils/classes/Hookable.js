class Hookable {
	hooks = {}

	static on(event_label, method) {
		Hookable.hooks[event_label] = method;
	}

	on(event_label, method) {
		if(!this.hooks) {
			Object.defineProperty(this, 'hooks', {
				value: { [event_label]: method },
				configurable: false,
				enumerable: false,
				writable: true
			});
		} else {
			this.hooks[event_label] = method;
		}
	}

	static trigger(event_label, parameters, fallback=false) {
		if(!parameters) {
			parameters = [];
		}

		if(event_label in Hookable.hooks) {
			return Hookable.hooks[event_label](...parameters);
		}
		return fallback;
	}

	trigger(event_label, parameters, fallback=false) {
		if(!parameters) {
			parameters = [];
		}

		if(event_label in (this.hooks || {})) {
			return this.hooks[event_label](...parameters);
		}
		return fallback;
	}

}
Hookable.hooks = {};

module.exports = { Hookable };