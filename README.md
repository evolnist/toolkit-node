# バッチ処理 ツールキット

繰り返し同じ処理を行うプログラムのベースとして利用できるツールキット（以降、本ツールキット）です。

次のような特徴があります。

* Node.js  
  様々な環境で動作します。  
  必要なモジュールがあれば自由に追加できます。

* TSV  
  リストデータの入力、出力はTSV(Tab Separated Values)ファイルです。  
  Excelとの間でコピー＆ペーストができます。  
  https://kantan-shikaku.com/ks/sedori-text-import/

* 正規表現  
  対象範囲は正規表現で指定します。
  https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_Expressions

* EJS  
  テンプレートエンジンはEJSです。
  https://ejs.co/


## 動作環境

本ツールキットを動作させるために以下のソフトウェアが必要です。

* Node.js 10


## セットアップ方法

この項は初回のみ必要な手順です。

1. Node.jsをインストールする  
お使いのOSにあった方法でNode.js 10以上のバージョンをインストールしてください。  
Windowsの場合は下記のURLからインストーラがダウンロードできます。  
https://nodejs.org/ja/download/releases/

2. 必要なモジュールをインストールする  
Windowsの場合は「install.bat」を実行してください。  
その他の環境はコンソールで次のコマンドを実行してください。
```bash
cd /path/to/toolkit
npm install
```

3. テストを実行する  
Windowsの場合はbatchkit/testディレクトリにある「run.js」を実行してください。  
その他の環境はコンソールで次のコマンドを実行してください。
```bash
cd /path/to/toolkit/batchkit/test
node test.js
```

## サンプルコード

機能ごとのサンプルコードです。  
機能は大きく次の種類に分類されます。

* 抽出  
  大量の詳細ページからマスタデータを作成するなどに使用できます。

* 生成  
  Excelの製品マスタから製品詳細ページを量産するなどに使用できます。

* 更新  
  ページごとにSEO施策を適用するなどに使用できます。

* 複製  
  ファイルパスの一覧から納品ファイルを作成するなどに使用できます。

* 汎用  
  大量のフォーム送信を自動化するなどに使用できます。


### 共通

```javascript
'use strict';
const Batchkit = require('/path/to/batchkit/batchkit.js');
const run = async () => {
    const batch = new Batchkit();

    // ここにバッチ処理を記述する
};

run().catch((e) => {
    // ここに問題が発生した場合の処理を記述する
});
```


### 抽出: extract()

大量の詳細ページからマスタデータを作成するなどに使用できます。

大量のファイル＋抽出ルールでリストデータを生成できます。  
抽出ルールを複数箇所にマッチさせて、カンマ区切りで記録することもできます。（example/multiline)  
1つのファイルを入力とすることもできます。例）一覧ページのHTML、RSS(example/list)

抽出したリストデータはgenerate()やupdate()の入力としても使えます。

```javascript
    // 一つの入力ファイルを1レコードとして抽出する場合
    await batch
        .input('list.tsv', {
            type: 'tsv',
            prefix: 'input/',
            field: 'filename'
        })
        .rule('rule.tsv')
        .output('result.tsv', {
            type: 'tsv',
			modifier: (record, index) => {
				if (record.title) {
					record.title = record.title.replace(/(\r\n|\n|\r|\t)/giu, '') // 改行、タブを削除
				}
				return record;
			}
        })
        .extract();
```

```javascript
	// 指定したディレクトリに含まれるファイルの一覧を入力とする場合
	await batch
		.input('input', {
			type: 'directory',
			field: 'path',
			filter: (record, index) => {
				return record.path.match(/\.html$/iu);
			}
		})
		.rule('rule.tsv')
		.output('result_directory.tsv', {
			type: 'tsv'
		})
		.extract();
```

```javascript
    // 一つの入力ファイルに複数のレコードが含まれている場合
    await batch
        .input('data.xml', {
            type: 'text',
            pattern: /(<item[\s\S]*?<\/item>)/gi
        })
        .rule('rule.tsv')
        .output('result.tsv', {
            type: 'tsv'
        })
       .extract();
```

```javascript
    // 複数のレコードが含まれているファイルを複数読み込んで一つのファイルに出力する場合
    await batch
        .input('list.tsv', {
            type: 'tsv',
            prefix: 'input/',
            field: 'filename',
            pattern: /(<item[\s\S]*?<\/item>)/gi
        })
        .rule('rule.tsv')
        .output('result.tsv', {
            type: 'tsv'
        })
        .extract();
```


### 生成: generate()

Excelの製品マスタから製品詳細ページを量産するなどに使用できます。

リストデータ＋テンプレートで大量のファイルを生成できます。  
1つのファイルに出力することもできます。例）一覧ページのHTML、RSS(example/list)  
連結すれば複数のリストを含むファイルも出力できます。例）おすすめとランキングを含むトップページ(example/list_multi)

extract()で抽出したリストデータを入力とすることもできます。

```javascript
    // 一つの入力ファイルを1レコードとして抽出する場合
    await batch
        .input('list.tsv', {
            type: 'tsv'
        })
        .template('template.html')
        .output('result/', {
            type: 'text',
            field: record => `${record.id}.html`
        })
        .generate();
```

```javascript
    // 複数のレコードを一つのファイルに出力する場合
    await batch
        .input('list.tsv')
        .with('pref', 'pref.tsv') // 別のリストも使用する
        .with('gender', 'gender.tsv') // 別のリストも使用する
        .template('template.html')
        .output('result/index.html')
        .generate();
```


### 更新: update()

ページごとにSEO施策を適用するなどに使用できます。

大量のファイル＋更新ルールで大量の更新済みファイルを生成できます。  
元のファイルを上書き更新することもできます。

extract()で抽出したリストデータを加工して入力とすることもできます。

```javascript
    await batch
		.input('list.tsv', {
			prefix: 'input/',
			field: 'filename'
		})
		.rule('rule.tsv')
		.output('result')
		.update();
```


### 複製: copy()

ファイルパスの一覧から納品ファイルを作成するなどに使用できます。

複製ルールに沿って階層を保った状態でファイルを複製できます。  
コピーする際にリネームや移動することができます。

```javascript
    await batch
		.input('list.tsv', {
			prefix: 'input/',
			field: 'filename'
		})
		.output('result')
		.copy();
```


### 汎用: batch()

大量のフォーム送信を自動化するなどに使用できます。

リストデータを元に定形の処理を繰り返し実行することができます。  
Batchkitクラスを継承してprocessRecord()を実装してください。

```javascript
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
		.input('list.tsv', {
			prefix: 'input/',
			field: 'filename'
		})
		.batch();
```


## ドキュメント

BatchkitクラスのメソッドとTSVファイルのフォーマットについてのドキュメントです。


### 設定メソッドと実行メソッド

* 設定メソッド  
  実行時の動作を指定するための設定を保存します。  
  処理は実行されませんので設定メソッドの順番は自由です。  
  input()、with()、without()、rule()、template()、output()

* 実行メソッド  
  設定メソッドで指定された動作で処理を実行します。  
  実行後も設定は残りますので一部の設定を変更して再度実行することも可能です。  
  extract()、generate()、update()、copy()、batch()


###  TSVファイル

CSVの区切り文字をカンマからタブに変えたテキストファイルです。  
本ツールキットでは1行を1レコード、1列を1フィールドとして扱います。  
1行目にフィールド名を指定してください。  

Excel上でコピーしたデータをテキストエディタに貼り付けるとTSV形式になっていますので、  
相互にコピー＆ペーストすることが可能です。（0から始まる数値など書式で表現が変わるデータにご注意ください。）

Excel上で全選択してコピーした場合は、すべての行の列数が同じになっているかを確認してください。  
レコードごとにフィールド数が異なると正常に読み込めないことがございます。


### `input(filename, options = {})`

入力として扱うリストデータを指定します。

* filename  

  * テキストファイル  
	入力として使用するファイルを直接指定できます。  
	generate()ではoptionsのpatternに正規表現を指定することでマッチした範囲を1件のデータとしてリストデータを入力できます。

  * ディレクトリ  
    指定したディレクトリに含まれるファイルの一覧が入力として扱われます。  
    optionsにfieldを指定してください。省略すると`path`がフィールド名になります。  
    一部のファイルを対象とする場合はoptionsのfilterにコールバック関数を指定してください。  
    対象ファイルの絞り込みが複雑な場合はTSVファイルで一覧を用意するほうがシンプルになります。

  * TSVファイル  
	CSVの区切り文字をカンマからタブに変えたテキストファイルのファイルパスを指定してください。  
	任意のフィールドをファイル名として扱い、読み込んだファイル内のテキストが処理対象となります。  
	optionsにfieldを指定してください。  

* options  

  * prefix  
	読み込むファイルのディレクトリなどを指定できます。（例：input/, http://example.jp/）

  * field  
	第1引数のfilenameがTSVファイルの場合、ファイル名として扱うフィールドを指定できます。（例：filename）  
    コールバック関数を指定して値を加工することもできます。  
    `record => ｀${record.id}.html｀`（全角チルダを半角に読み替えてください。）

  * pattern  
	1レコード分を表す正規表現を指定すると、$1にマッチしたテキストが処理対象となります。  
    改行も含む任意の文字にマッチさせるには`[\s\S]`や`[^]`を使って`/(<item[\s\S]*?<\/item>)/imu`このように指定してください。  
    （Node.jsがsフラグ(dotAll)に対応しているバージョンなら`.`が改行文字にもヒットするようになります。）

  * modifier  
    値を調整してから入力として使いたい場合にはコールバック関数を指定してください。 
    filterの前に実行されます。   
    `(record, index) => record`

  * filter  
    値を判定して入力から除外したい場合にはコールバック関数を指定してください。  
    modifierの後に実行されます。
    `(record, index) => true`


### `with(key, path)`

テンプレート内で使える追加のリストデータを指定します。  
`<%= pref[record.pref].name %>`

* key  
  テンプレート内でリストデータにアクセスする際の名前を指定してください。

* path  
  TSVファイルのファイルパスを指定してください。  
  id列が連想配列のキーとして使われますので必ず含むようにしてください。


### `without(key)`

テンプレート内で使える追加のリストデータを削除します。

* key  
  with()で指定した名前を指定してください。


### `rule(path, options = {})`

ルールとして扱うリストデータを指定します。

* path  

  * TSVファイル  
	CSVの区切り文字をカンマからタブに変えたテキストファイルのファイルパスを指定してください。  
    実行する処理によって使用できるフィールドが異なります。

* options  
  現時点ではオプションはありません。

TSVファイルは下記のフィールドが使用できます。

* 抽出: extract()  
  フィールドの順序は任意です。

  * silent  
    1を指定するとそのルールの情報が出力されなくなります。

  * name  
    ルールの名前を指定してください。処理結果のフィールド名に使用されます。

  * item  
    抽出するテキストを正規表現で指定してください。（例：`/<title>(.*?)<\/title>/imu`）

  * その他  
    それ以外のフィールドは無視されますので、自由にお使いください。

* 更新: update()  
  フィールドの順序は任意です。

  * silent  
    1を指定するとそのルールの情報が出力されなくなります。

  * from  
    更新するテキストを正規表現で指定してください。（例：`/<title>.*?<\/title>/imu`）

  * to  
    更新後のテキストをEJSの書式で指定してください。（例：`<title><%= record.title %></title>`）

  * その他  
    それ以外のフィールドは無視されますので、自由にお使いください。


### `template(path, options = {})`

generate()でテンプレートとして扱うファイルのパスを指定します。

* path  

  * テキストファイル  
	テンプレートとして使用するファイルのパスを指定してください。  
    EJSの書式でデータの反映方法を指定してください。（例：`<title><%= record.title %></title>`）  
    出力が1ファイルの場合は繰り返しの制御分も利用できます。  
    ```
    <% for (let record of records) { -%>
	<% } -%>
    ```

* options  
  現時点ではオプションはありません。


### `output(path, options = {})`

出力先として扱うファイルやディレクトリのパスを指定します。

* path  

  * テキストファイル  
	出力先として使用するファイルのパスを指定してください。  

  * ディレクトリ  
    generate()で入力1件を1ファイルとして出力する場合は  
	出力先として使用するディレクトリのパスを指定してください。  
	optionsにfieldを指定してください。

* options  

  * field  
	第1引数のpathがディレクトリの場合、ファイル名として扱うフィールドを指定できます。（例：filename）  
    コールバック関数を指定して値を加工することもできます。  
    `record => ｀${record.id}.html｀`（全角チルダを半角に読み替えてください。）

  * modifier  
    値を調整してから出力したい場合にはコールバック関数を指定してください。  
    filterの前に実行されます。   
    `(record, index) => record`

  * filter  
    値を判定して出力から除外したい場合にはコールバック関数を指定してください。  
    modifierの後に実行されます。
    `(record, index) => true`
