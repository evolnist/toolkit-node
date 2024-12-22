"use strict";

var Batchkit = require('./batchkit/batchkit.js')

var batch = new Batchkit();

// 抽出処理(Extractor)
batch
	.input('list.tsv', {
		'prefix': 'input/',
		'field': 'filename'
	})
	.rule('rule.tsv')
	.output('result.tsv')
	.extract();

// 一つの入力ファイルに複数のレコードが含まれている場合
batch
	.input('data.xml', {
		'pattern': /(<item .+?<\/item>)/gim
	})
	.rule('rule.tsv')
	.output('result.tsv')
	.extract();

// 複数のレコードが含まれているファイルを複数読み込んで一つのファイルに出力する場合
batch
	.input('list.tsv', {
		'prefix': 'input/',
		'field': 'filename',
		'pattern': /(<item .+?<\/item>)/gim
	})
	.rule('rule.tsv')
	.output('result.tsv')
	.extract();


// 生成処理(Generator)
batch
	.input('list.tsv')
	.template('template.html')
	.output('result', {
		'filename': '%(id)s.html'
	})
	.generate();

// 複数のレコードを一つのファイルに出力する場合
batch
	.input('list.tsv')
	.with('pref', 'pref.tsv') // 別のリストも使用する
	.with('gender', 'gender.tsv') // 別のリストも使用する
	.template('template.html')
	.output('result.xml')
	.generate();


// 更新処理(Updater)
batch
	.input('list.tsv', {
		'prefix': 'input/',
		'field': 'filename'
	})
	.rule('rule.tsv')
	.output('result')
	.update();


// 複製処理(Copier)
batch
	.input('list.tsv', {
		'prefix': 'input/',
		'field': 'filename'
	})
	.output('result')
	.copy();


input(filename, options)

filename
	テキストファイル
		入力として使用するファイルを直接指定できます。
		optionsにpatternを指定してください。
	TSVファイル
		CSVの区切り文字をカンマからタブに変えたテキストファイルです。
		任意のフィールドをファイル名として扱い、読み込んだファイル内のテキストが処理対象となります。
		optionsにfieldを指定してください。
		optionsにpatternを指定することができます。

options
	prefix
		読み込むファイルのディレクトリなどを指定できます。（例：input/, http://example.jp/）
	field
		第1引数のfilenameがTSVファイルの場合、ファイル名として扱うフィールドを指定できます。（例：filename）
	pattern
		1レコード分を表す正規表現を指定すると、マッチしたテキストが処理対象となります。


rule(filename)

filename
	TSVファイル
		CSVの区切り文字をカンマからタブに変えたテキストファイルです。
		実行する処理によって使用できるフィールドが異なります。

rule.tsv

extract
	フィールドとしてsilent,name,item,modifierが指定できます。（フィールドの順序は任意）
		silent
			1を指定するとそのルールの情報が出力されなくなります。
		name
			ルールの名前を指定してください。処理結果のフィールド名に使用されます。
		item
			抽出するテキストを正規表現で指定してください。（例：/<title>(.*?)<\/title>/）
		modifier
			正規表現にマッチしたテキストに適用する処理を指定できます。（例：str_replace(',',' ',%s)、'http://example.jp/'.%s）
		その他
			それ以外のフィールドは無視されますので、自由にお使いください。

update
	フィールドとしてsilent,from,toが指定できます。（フィールドの順序は任意）
		silent
			1を指定するとそのルールの情報が出力されなくなります。
		from
			更新するテキストを正規表現で指定してください。（例：/<title>.*?<\/title>/）
		to
			更新後のテキストをSmartyの書式で指定してください。（例：<title>{title}</title>）
		その他
			それ以外のフィールドは無視されますので、自由にお使いください。
