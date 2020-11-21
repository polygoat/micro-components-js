const string_to_any = text => {
	try {
		return JSON.parse(text);
	} catch {
		if(text.length) {	
			return text;
		}
	}
};

module.exports = {
	string_to_any
};