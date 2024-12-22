'use strict';

const Log = require('./log.js');
const log = new Log();
const util = require('./util.js');
const Config = require('./config.js');

class Batchkit {
	constructor(batch) {
		if (batch) {
			this.config = new Config(batch.getConfig());
			this.data = util.defaults(this.data, batch.data);
		}
		else {
			this.config = new Config();
			this.data = {};
		}
	}

	input(path, options = {}) {
		log.info('Input', path);

		options = util.assign(options, {
			path: path
		});
		this.setConfig('input', options);

		return this;
	}

	with(key, path) {
		log.info('With', `${key}(${path})`);

		const options = {};
		options[key] = path;
		this.setConfig('with', options);

		return this;
	}

	without(key = null) {
		log.info('Without', key);

		this.unsetConfig('with', key);

		return this;
	}

	rule(path, options = {}) {
		log.info('Rule', path);

		options = util.assign(options, {
			path: path
		});
		this.setConfig('rule', options);

		return this;
	}

	template(path, options = {}) {
		log.info('Template', path);

		options = util.assign(options, {
			path: path
		});
		this.setConfig('template', options);

		return this;
	}

	output(path, options = {}) {
		log.info('Output', path);

		options = util.assign(options, {
			path: path
		});
		this.setConfig('output', options);

		return this;
	}

	getConfig() {
		return this.config;
	}

	setConfig(category, options) {
		this.config.set(category, options);

		return this;
	}

	unsetConfig(category, options) {
		this.config.unset(category, options);

		return this;
	}

	async prepare() {
		try {
			// TODO: this.data.resultがある場合は次の処理の入力として引き継ぐ

			if (this.config.has('with')) {
				const withData = await this.setupWith(this.config.get('with'));
				this.data.with = withData;
			}
		}
		catch (e) {
			log.warn(`Failure prepare`);
		}
	}

	async batch() {
		log.info('Batch');

		await this.prepare();

		try {
			this.data.input = await this.setupInput(this.config.get('input'));

			this.data.result = await this.process(this.processRecord);

			log.info('Complete', `${this.data.result.length} record processed`);
			log.blank();
			return this;
		}
		catch (e) {
			log.error(`Stopped`);
			log.blank();
			throw e;
		}
	}

	async extract() {
		log.info('Extract');

		await this.prepare();

		try {
			this.data.input = await this.setupInput(this.config.get('input'));

			this.data.rule = await this.setupRule(this.config.get('rule'));

			const result = await this.process(this.processExtract);
			this.data.result = [result];

			const cnt = await this.doOutput(this.config.get('output'));

			log.info('Complete', `${cnt} record processed`);
			log.blank();
			return this;
		}
		catch (e) {
			log.error(`Stopped`);
			log.blank();
			throw e;
		}
	}

	async generate() {
		log.info('Generate');

		await this.prepare();

		try {
			this.data.input = await this.setupInput(this.config.get('input'));

			this.setupTemplate(this.config.get('template'));

			if (this.config.has('output', 'field')) {
				this.data.result = await this.process(this.processGenerate);
			}
			else {
				const result = await this.processGenerateList(util.assign({
					records: this.data.input
				}, this.data.with));
				this.data.result = [result];
			}

			const cnt = await this.doOutput(this.config.get('output'));

			log.info('Complete', `${cnt} record processed`);
			log.blank();
			return this;
		}
		catch (e) {
			log.error('Stopped');
			log.blank();
			throw e;
		}
	}

	async update() {
		log.info('Update');

		try {
			log.error('Not implemented yet!');
			log.blank();
			return this;
		}
		catch (e) {
			log.error('Stopped');
			log.blank();
			throw e;
		}
	}

	async copy() {
		log.info('Copy');

		try {
			log.error('Not implemented yet!');
			log.blank();
			return this;
		}
		catch (e) {
			log.error('Stopped');
			log.blank();
			throw e;
		}
	}

	async setupInput(config) {
		if (!config || !config.path) {
			const message = 'No such config.input.path';
			log.error(message);
			throw new Error(message);
		}

		let data = [];
		config.type = (config.type ? config.type : 'tsv');
		if (config.type == 'tsv') {
			log.info('Read input file', config.path);
			data = await util.readTsv(config.path);
		}
		else if (config.type == 'directory') {
			log.info('Read input directory', config.path);
			const files = await util.readDirectory(config.path);

			config.prefix = config.path + '/';
			config.field = (config.field ? config.field : 'path');
			data = util.map(files, file => {
				const record = {};
				record[config.field] = file.replace(config.prefix, '');
				return record;
			})
		}

		if (config.modifier) {
			data.forEach((record, index) => {
				record = config.modifier(record, index);
			});
			log.info('Modifiered input data');
		}
		if (config.filter) {
			data = util.filter(data, (record, index) => {
				return config.filter(record, index);
			});
			log.info('Filtered input data');
		}
		return data;
	}

	async setupRule(config) {
		if (!config || !config.path) {
			const message = 'No such config.rule.path';
			log.error(message);
			throw new Error(message);
		}

		log.info('Read rule file', config.path);
		return await util.readTsv(config.path);
	}

	async setupWith(config) {
		if (!config || Object.keys(config).length <= 0) {
			const message = 'No such config.with';
			log.error(message);
			throw new Error(message);
		}

		const tasks = {};
		for (let [key, path] of Object.entries(config)) {
			log.info('Read with file', path);
			tasks[key] = util.readTsv(path);
		}

		const data = {};
		const keys = Object.keys(tasks);
		const allTasks = await Promise.all(Object.values(tasks));
		for (let [i, records] of Object.entries(allTasks)) {
			data[keys[i]] = util.chain(records).compact().mapKeys(record => record.id).value();
		}

		return data;
	}

	setupTemplate(config) {
		if (!config || !config.path) {
			const message = 'No such config.template.path';
			log.error(message);
			throw new Error(message);
		}
	}

	async process(processRecord, data) {
		processRecord = processRecord || this.processRecord;
		data = data || this.data;

		log.info('Start parallel processing');

		const tasks = [];
		for (let [index, record] of data.input.entries()) {
			try {
				tasks.push(processRecord.call(this, index, record));
			}
			catch (e) {
				log.warn(`There was a problem of line ${index + 1}`, e);
				// 処理を止めないためthrowしない
			}
		}

		const results = [];
		for (let result of await Promise.all(tasks)) {
			results.push(result);

			// 非同期のためログの順序が同じになるようにプールしてから出力を実行する
			if (typeof result !== 'undefined' && typeof result.logs !== 'undefined') {
				for (let func of result.logs) {
					if (typeof func === 'function') {
						func();
					}
					else {
						log.warn(`Must be a function, ${typeof func} given` , JSON.stringify(func));
					}
				}
			}
		}

		return util.chain(results).map((result) => {
			if (!result.data) {
				return null;
			}
			else {
				return Object.keys(result.data).length ? result.data : null;
			}
		}).compact().sortBy('index').value();
	}

	async processRecord(index, record) {
		const message = `Not implemented process of line ${index + 1}`;
		log.error(message);
		throw new Error(message);
	}

	async processExtract(index, record) {
		const matches = {};
		const logs = [];
		const prefix = this.config.get('input', 'prefix');
		const path = prefix + record.filename;

		if (! await util.existsFile(path)) {
			const message = `Not such file ${record.filename} of line ${index + 1}`;
			logs.push(log.warn(message, '', false));
			return {
				'index': index,
				'data': matches,
				'logs': logs
			};
		}
		try {
			const buff = await util.readFile(path);
			logs.push(log.info('Process', record.filename, false));

			matches['filename'] = record.filename;

			for (let [i, rule] of this.data.rule.entries()) {
				const r = this.parseRule(rule);
				if (!r) {
					logs.push(log.warn(`Invalid rule of line ${i + 1} on ${record.filename}`, '', false));
					continue;
				}

				const re = new RegExp(r.pattern, r.flags);
				const m = buff.match(re);
				if (m) {
					matches[rule.name] = m[1];
				}
				else if (!rule.silent) {
					logs.push(log.info(`Not match rule of line ${i + 1} on ${record.filename}`, '', false));
					matches[rule.name] = null;
				}
			}
		}
		catch (e) {
			const message = `Failure read file ${record.filename} of line ${index + 1}`;
			logs.push(log.warn(message, e, false));
		}
		finally {
			return {
				'index': index,
				'data': matches,
				'logs': logs
			};
		}
	}

	async processGenerate(index, record) {
		let buff = null;
		const logs = [];

		try {
			buff = await util.renderFile(this.config.get('template').path, record);
			logs.push(log.info('Process', record.id, false));
		}
		catch (e) {
			const message = `Failure generate ${record.id} of line ${index + 1}`;
			logs.push(log.warn(message, e, false));
		}
		finally {
			return {
				'index': index,
				'data': buff,
				'logs': logs
			};
		}
	}

	async processGenerateList(data) {
		let buff = null;
		try {
			buff = await util.renderFile(this.config.get('template').path, data);
			log.info('Process');
		}
		catch (e) {
			log.warn(`Failure generate`);
			throw e;
		}

		return buff;
	}

	parseRule(rule) {
		const matches = rule.item.match(/^\/(.+)\/([gimsuy]*)$/i);
		if (!matches) {
			return matches;
		}
		else {
			return {
				'pattern': matches[1],
				'flags': matches[2]
			};
		}
	}

	async doOutput(config) {
		if (!config || !config.path) {
			const message = 'No such config.output.path';
			log.error(message);
			throw new Error(message);
		}

		let path = config.path;

		try {
			if (!util.has(config, 'field')) {
				log.info('Write output file', path);

				const result = this.data.result[0];

				await this.outputByData(config, path, result);

				if (util.isString(result)) {
					return 1;
				}
				else {
					return result.length;
				}
			}
			else {
				const tasks = [];
				for (let [index, record] of Object.entries(this.data.input)) {
					let filename;
					if (util.isFunction(config.field)) {
						filename = config.field(record);
					}
					else {
						filename = record[config.field];
					}
					path = `${config.path}${filename}`;

					log.info('Write output file', path);
					tasks.push(this.outputByData(config, path, this.data.result[index], index));
				}

				const allTasks = await Promise.all(tasks);
				return allTasks.length;
			}
		}
		catch (e) {
			log.error(`Unable to write file ${path}`, e);
			throw e;
		}
	}

	outputByData(config, path, data, index = 0) {
		if (!path || !data) {
			return false;
		}
		else if (util.isString(data)) {
			if (config.modifier) {
				data = config.modifier(data, index);
				log.info('Modified output data');
			}
			return util.writeFile(path, data);
		}
		else {
			if (config.modifier) {
				data.forEach((record, index) => {
					record = config.modifier(record, index);
				});
				log.info('Modified output data');
			}
			if (config.filter) {
				data = data.filter((record, index) => {
					return config.filter(record, index);
				});
				log.info('Filtered output data');
			}
			return util.writeTsv(path, data);
		}
	}
}

module.exports = Batchkit;
