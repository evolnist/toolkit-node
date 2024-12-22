'use strict';

const Log = require('../log.js');
const log = new Log();
const Batchkit = require('../batchkit.js');

const test = async () => {

	// 抽出処理
	const ext = new Batchkit();
	await ext
		.input('data/extract/list.tsv', {
			type: 'tsv',
			prefix: 'data/extract/input/',
			field: 'filename'
		})
		.rule('data/extract/rule.tsv')
		.output('data/extract/result.tsv', {
			type: 'tsv'
		})
		.extract();

	// 指定したディレクトリに含まれるファイルの一覧を入力とする場合
	const extDirectory = new Batchkit();
	await extDirectory
		.input('data/extract/input', {
			type: 'directory',
			field: 'filename',
			filter: (record, index) => {
				return record.filename.match(/\.html$/iu);
			}
		})
		.rule('data/extract/rule.tsv')
		.output('data/extract/result_directory.tsv', {
			type: 'tsv',
			modifier: (record, index) => {
				if (record.title) {
					record.title = record.title.replace(/(\r\n|\n|\r|\t)/giu, '') // 改行、タブを削除
				}
				return record;
			}
		})
		.extract();
	
	// // 一つの入力ファイルに複数のレコードが含まれている場合
	// const extMulti = new Batchkit();
	// await extMulti
	// 	.input('data/extract/data.xml', {
	// 		type: 'text',
	// 		pattern: /(<item[\s\S]*?<\/item>)/gi
	// 	})
	// 	.rule('data/extract/rule.tsv')
	// 	.output('data/extract/result.tsv', {
	// 		type: 'tsv'
	// 	})
	// 	.extract();

	// // 複数のレコードが含まれているファイルを複数読み込んで一つのファイルに出力する場合
	// const extMultiFromList = new Batchkit();
	// await extMultiFromList
	// 	.input('data/extract/list.tsv', {
	// 		type: 'tsv',
	// 		prefix: 'data/extract/input/',
	// 		field: 'filename',
	// 		pattern: /(<item[\s\S]*?<\/item>)/gi
	// 	})
	// 	.rule('data/extract/rule.tsv')
	// 	.output('data/extract/result.tsv')
	// 	.extract();


	// 生成処理
	const gen = new Batchkit();
	await gen
		.input('data/generate/list.tsv', {
			type: 'tsv',
			modifier: (record, index) => {
				if (record.comment) {
					record.comment = record.comment.replace(/\\n/g, "\n");
				}
				return record;
			}
		})
		.template('data/generate/template_detail.html')
		.output('data/generate/result/', {
			type: 'text',
			field: record => `${record.id}.html`
		})
		.generate();

	// 複数のレコードを一つのファイルに出力する場合
	const genList = new Batchkit();
	await genList
		.input('data/generate/list.tsv')
		.with('pref', 'data/generate/pref.tsv') // 別のリストも使用する
		.with('gender', 'data/generate/gender.tsv') // 別のリストも使用する
		.template('data/generate/template_list.html')
		.output('data/generate/result/index.html')
		.generate();


	// 更新処理
	const up = new Batchkit();
	await up
		.input('list.tsv', {
			prefix: 'input/',
			field: 'filename'
		})
		.rule('rule.tsv')
		.output('result')
		.update();


	// 複製処理
	const cp = new Batchkit();
	await cp
		.input('list.tsv', {
			prefix: 'input/',
			field: 'filename'
		})
		.output('result')
		.copy();


	// 自動処理(Batch)
	class CustomBatchkit extends Batchkit {
		async processRecord(index, record) {
			let buff = null;
			const logs = [];

			buff = 'Batch Test';
			logs.push(log.info('Process', record.filename, false));

			return {
				'index': index,
				'data': buff,
				'logs': logs
			};
		}
	}

	const bat = new CustomBatchkit();
	await bat
		.input('data/extract/list.tsv', {
			prefix: 'data/extract/input/',
			field: 'filename'
		})
		.batch();


	// Configクラス関連
	log.log('Config', ext.getConfig());
	log.log('Config.input.path', ext.getConfig().get('input', 'path'));
	log.log('Config.output', ext.getConfig().get('output'));

	const configTest = new Batchkit(genList);
	configTest.unsetConfig('input', [
		'pattern',
		'dummy'
	]);
	configTest.unsetConfig('output');
	configTest.unsetConfig('dummy', [
		'dummy'
	]);

	log.log('Config', configTest.getConfig());
};

test().catch((err) => {
	log.log('Test Stopped', err);
});
