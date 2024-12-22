'use strict';

const util = require('./util.js');

class Config {
	constructor(config) {
		this.config = {};

		if (config) {
			util.defaults(this.config, config.config);
		}
	}

	set(category, options) {
		if (!this.config[category]) {
			this.config[category] = {};
		}

		if (options) {
			this.config[category] = util.assign(options, this.config[category]);
		}

		return this;
	}

	unset(category, optionNames) {
		if (!this.config[category]) {
			return this;
		}

		if (optionNames) {
			this.config[category] = util.omit(this.config[category], optionNames);
		}
		else {
			this.config = util.omit(this.config, category);
		}

		return this;
	}

	get(category, optionName) {
		if (!this.config[category]) {
			return undefined;
		}

		if (optionName) {
			return this.config[category][optionName];
		}
		else {
			return this.config[category];
		}
	}

	has(category, optionName) {
		if (!this.config[category]) {
			return false;
		}

		if (optionName) {
			return this.config[category][optionName];
		}
		else {
			return this.config[category];
		}
	}
}

module.exports = Config;
