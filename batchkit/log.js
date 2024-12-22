'use strict';

const util = require('./util.js');

class Log{
	constructor(isDebug = true) {
		this.isDebug = isDebug;
	}

	blank(doOutput = true) {
		if (!doOutput) {
			return "\n";
		}

		console.log();

		return this;
	}

	line(message = '---', doOutput = true) {
		if (!doOutput) {
			return message + "\n";
		}

		console.log(message);

		return this;
	}

	log(name, message, doOutput = true) {
		if (this.isDebug) {
			let output = this.makeOutput('Log', name, message);
			let func = this._delegate(console.log, output);

			if (doOutput) {
				func();
			}
			else {
				return func;
			}
		}
		else {
			if (!doOutput) {
				return () => {};
			}
		}

		return this;
	}

	info(name, message, doOutput = true) {
		let output = this.makeOutput('Info', name, message);
		let func = this._delegate(console.info, output);

		if (doOutput) {
			func();
		}
		else {
			return func;
		}

		return this;
	}

	warn(name, message, doOutput = true) {
		let output = this.makeOutput('Warning', name, message);
		let func = this._delegate(console.warn, output);

		if (doOutput) {
			func();
		}
		else {
			return func;
		}

		return this;
	}

	error(name, message, doOutput = true) {
		let output = this.makeOutput('Error', name, message);
		let func = this._delegate(console.error, output);

		if (doOutput) {
			func();
		}
		else {
			return func;
		}

		return this;
	}

	makeOutput(status, name, message) {
		let output = '';
		if (message) {
			if (!util.isString(message)) {
				message = "\n" + util.inspect(message);
			}
			else if (message.indexOf("\n") !== -1) {
				message = "\n" + message;
			}
			return `${status}\t${name}\t${message}`;
		}
		else {
			return `${status}\t${name}`;
		}
	}

	_delegate(method, output) {
		return () => {
			method.call(console, output);
		};
	}
}

module.exports = Log;
