'use strict';

const util = require('util');
const fs = require('fs-extra');
const glob = require('glob');
const CSV = require('comma-separated-values');
const lodash = require('lodash');
const ejs = require('ejs');

class Util {
	constructor() {
	}

	inspect(...args) {
		return util.inspect(...args);
	}

	inherits(...args) {
		return util.inherits(...args);
	}


	// fs-extra
	async existsFile(path) {
		return await fs.exists(path);
	}

	async readFile(...args) {
		const data = await fs.readFile(...args);
		return data.toString();
	}

	async writeFile(path, data, options) {
		await fs.mkdirs(path.replace(/[^/]*$/, ''));
		return await fs.writeFile(path, data, options)
	}

	async readTsv(path) {
		const tsv = await this.readFile(path).catch((err) => {
			const message = `Unable to read file ${path}`;
			throw new Error(message);
		});

		const parser = new CSV(tsv, {
			'cast': true,
			'header': true,
			'cellDelimiter': '\t'
		});
		return parser.parse();
	}

	async writeTsv(path, data) {
		const length = this.chain(data).first().keys().value().length;
		const casts = this.map(new Array(length), () => {
			return 'Primitive';
		});
		const tsv = new CSV(data, {
			'cast': casts,
			'header': true,
			'cellDelimiter': '\t'
		});
		const buff = tsv.encode();

		await this.writeFile(path, buff);
		return data.length;
	}


	// glob
	readDirectory(path, options = {}) {
		options = this.defaults({
			nodir: true
		}, options);

		return new Promise((resolve, reject) => {
			glob(path + '/**/*', options, (err, files) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(files);
				}
			});
		});
	}


	// lodash
	defaults(...args) {
		return lodash.defaults(...args);
	}

	assign(...args) {
		return lodash.assign(...args);
	}

	has(...args) {
		return lodash.has(...args);
	}

	omit(...args) {
		return lodash.omit(...args);
	}

	first(...args) {
		return lodash.first(...args);
	}

	keys(...args) {
		return lodash.keys(...args);
	}

	map(...args) {
		return lodash.map(...args);
	}

	sortBy(...args) {
		return lodash.sortBy(...args);
	}

	compact(...args) {
		return lodash.compact(...args);
	}

	isString(...args) {
		return lodash.isString(...args);
	}

	isFunction(...args) {
		return lodash.isFunction(...args);
	}

	chain(...args) {
		return lodash.chain(...args);
	}

	value(...args) {
		return lodash.value(...args);
	}

	filter(...args) {
		return lodash.filter(...args);
	}


	// EJS
	render(...args) {
		return ejs.render(...args);
	}

	renderFile(...args) {
		return ejs.renderFile(...args);
	}
}

module.exports = new Util();
