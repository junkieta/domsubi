[![npm version](https://badge.fury.io/js/domsubi.svg)](https://badge.fury.io/js/domsubi)
[![Downloads](http://img.shields.io/npm/dm/domsubi.svg)](https://npmjs.org/package/domsubi)

# domsubi
ブラウザ側のDOM更新をFRPで処理するためのライブラリ。前提として[sodium-typescript](https://github.com/SodiumFRP/sodium-typescript/)を利用する。

ヴァーチャルDOM実装でもあるが、facebook-reactのJSXとは異なるjavascriptのオブジェクトリテラルを活かした記法([jshtml記法](#jshtml%E8%A8%98%E6%B3%95%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6))を採用。

名称はdomsubi = DOM-MUSUBI、DOMのおむすび。sodium(塩)を核にしてDOMを管理するところから。

## インストール
### umd(依存ライブラリを含めたバンドル版)
`domsubi`がグローバル変数になる。
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/domsubi/dist/domsubi.umd.js"></script>
```
### esm(依存ライブラリを含めたバンドル版)
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/domsubi/dist/domsubi.min.js"></script>
```
### esm(別途sodiumjsのモジュール版のインポートが必要)
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/domsubi/dist/domsubi.esm.js"></script>
```
### npm
```bash
$> npm install domsubi
$> npm install -g domsubi
```

## 使用例
[domsubi example page](https://junkieta.github.io/domsubi/)にて紹介。

## jshtml記法について
jshtml記法ではJavaScriptオブジェクトリテラルでDOMを記述する。入れ子構造をシンプルに扱えるので、FRP値をDOMに手軽に埋め込むことができる。原案となった制作者のページは既にないが、取り扱いの容易さから採用している。

### 要素の表現
要素は`{ タグ: 内容 }`とすることで記述できる。属性を含む場合は、$をキーとして記述する。
```javascript
{ p: 'Hello World', $: { title: 'Goodbye World' } }
// => <p title="Goodbye World">Hello World</p>
```

### イベントハンドラの表現
属性値としてイベントハンドラが想定される個所では、Function,EventListenerObjectを指定できる。
```javascript
{ p: 'Hello World',
  $: {
    title: 'Goodbye World',
    onclick: (e) => console.log(e), // OK
    ondblclick: { handleEvent(e) { console.log(e) } } // OK
  }
}
```

### インラインスタイルの表現
style属性は[CSSStyleDeclaration](https://developer.mozilla.org/ja/docs/Web/API/CSSStyleDeclaration)にならい、名前付きプロパティをObjectで表現することができる。
```javascript
{ p: 'Hello World',
  $: {
    style: {
      backgroundColor: 'white',
      // "background-color": 'white' でも可
    }
  }
}
// => <p style="background-color: white;">Hello World</p>
```

### カスタムデータ属性の表現
[data-*属性](https://developer.mozilla.org/ja/docs/Web/API/HTMLElement/dataset)については、datasetプロパティのObjectで表現できる。
```javascript
{ p: 'Hello World',
  $: {
    dataset: {
      exampleMessage: 'Goodbye World' // data-example-message属性になる
    }
  }
}
// => <p data-example-message="Goodbye World">Hello World</p>
```

### 複数ノードの表現
複数のノードを持つ場合はArrayを使えばよい。
```javascript
{ p: [{ em:'H' },'ello World'] }
// <p><em>H</em>ello World</p>
```

## FRP値からノードを生成する
jshtml記法の中で、DOMにFRPを取り込む時は[sodium/Cell](https://github.com/SodiumFRP/sodium-typescript/blob/master/src/lib/sodium/Cell.ts)を用いればよい。
```javascript
const message = new CellSink('Hello');
const paragraph = new jshtml({ p: [message,' World'] })
paragraph.mountAsContents(document.body);

message.send('Goodbye'); // <p>Hello World</p> => <p>Goodbye World</p>
```
ノードの他、属性リスト、属性値にもFRP値を指定できる。
```javascript
const attr_title_value = new CellSink('Hello');
const attr_values = new Cell({ title: attr_title_value  });
const paragraph = new jshtml({ p: 'World', $: attr_values })
paragraph.mountAsContents(document.body);

attr_title_value.send('Goodbye'); // <p title="Hello">World</p> => <p title="Goodbye">World</p>
```
イベントは[sodium/StreamSink](https://github.com/SodiumFRP/sodium-typescript/blob/master/src/lib/sodium/StreamSink.ts)によってStreamとして取得できる。
```javascript
const sMouseout = new StreamSink();
const paragraph = new jshtml({ p: 'Hello World', $: { onmouseout: sMouseout } })
paragraph.mountAsContents(document.body);
sMouseout.listen((e) => console.log('mouseout from paragraph'));
```

## ノードからFRP値を生成する
ヘルパー関数群を用いて生成済みのノードからFRP値を取得できる。

### events - DOMイベントをStream化する
```javascript
const sKeydown = events(document).keydown; // Stream<KeyboardEvent>
sKeydown.listen((e) => console.log(e)); // KeyboardEvent
```

### mutations - DOMの変異をStream化する
```javascript
const sMutateChild = mutations(document.body, { childList: true }); // Stream<MutationRecord>
sMutateChild.listen((r) => console.log(r)); // MutationRecord
```

### attributes - 属性値のCellを取得する
```javascript
const attrCell = attributes(document.body).id; // Cell<string>
document.body.setAttribute('id', 'sample-doc');
attrCell.sample(); // "sample-doc"
```
