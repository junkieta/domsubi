# domsubi example page
[junkieta/domsubi](https://github.com/junkieta/domsubi)の作例紹介ページ。
## クリックカウンター
```javascript
// クリックイベント取得用Stream
const sClicked = new StreamSink();
// クリックイベントをカウントするCell
const countClicked = sClicked.accum(0, (u,n) => n + 1);
// クリック5回毎に"red", でなければ"black"を返すCell
const varColor = countClicked.map((n) => n % 5 ? 'black' : 'red');
// click回数を表示するVAR要素
const countClickedVar = {
    var: countClicked,
    $: {
        style: {
            color: varColor
        }
    }
};
// 全体
const contents = new jshtml([
    { button: 'クリックよろしく!!', $: { onclick: sClicked } },
    { p: ['君は ', countClickedVar, ' 回クリックしている'] }
]);
// マウントする
contents.mount(targetNode);
```
- [実行結果サンプルページ](./click-counter.html)