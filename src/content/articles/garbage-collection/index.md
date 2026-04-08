---
title: "【C#】GC（ガベージコレクター）とは？"
description: "GCについてざっくりとした認識しかしていなかったのですが、気が向いたので勉強しました。 GC周りの用語 GC周りの用語について、簡単にまとめました。 用語 説明 GC（ガベージコレクター） アプリケーションのメモリを自動 … 【C#】GC（ガベージコレクター）とは？"
publishedAt: "2020-06-17T19:51:25+09:00"
updatedAt: "2020-06-17T19:51:49+09:00"
tags:
  - "csharp"
---

GCについてざっくりとした認識しかしていなかったのですが、気が向いたので勉強しました。

## GC周りの用語

GC周りの用語について、簡単にまとめました。

| 用語 | 説明 |
| --- | --- |
| GC（ガベージコレクター） | アプリケーションのメモリを自動で管理（割り当て・解放）する機能。 |
| マネージヒープ | GCによって管理されるメモリの一部。すべての参照型はここに割り当てられる。「マネージヒープ」「マネージドヒープ」で表記揺れがある。 |
| GC Allocation | GCがマネージヒープにオブジェクトをAllocation（割り当て）すること。 |
| ガベージコレクション | メモリを解放するプロセスのこと。アプリケーションで使われなくなったオブジェクトが占有しているメモリを開放する。 |

## GC Allocation（メモリ割り当て）はいつ発生する？

オブジェクトを生成したときに発生します。

```cs

// オブジェクトを生成すると、そのオブジェクトの為のメモリがマネージヒープに割り当てられる
var hoge = new HogeObject();
```

このメモリ割り当てでよく起こる問題が、**「一見オブジェクトを生成していないように見えて、実はオブジェクトを生成している」**です。

「GC Allocを減らす方法」的な記事で書かれていることは、こういった状況に対する対策です。以下の記事はその状況の例です。

-   [Unity での GC Alloc対策 ダイジェスト](https://qiita.com/TacOkubo/items/13c97275ac191352e4ef)
-   [【Unity, C#】foreach の GC Alloc 条件を調べてみた](https://virtualcast.jp/blog/2020/03/foreach_gc_alloc/)

## ガベージコレクション（メモリ解放）はいつ発生する？

| ガベージコレクションの発生条件 | 備考 |
| --- | --- |
| システムの物理メモリが少ない場合 | OS からのメモリ不足通知またはホストによって示されたメモリ不足のいずれかによって検出されます。 |
| マネージヒープに割り当てられたオブジェクトが占有するメモリが、許容されるしきい値を超える場合 | このしきい値は、プロセスの進行に合わせて絶えず調整されます。 |
| [GC.Collect](https://docs.microsoft.com/ja-jp/dotnet/api/system.gc.collect) メソッドが呼び出された時 | ほとんどの場合、ガベージ コレクターは継続して実行されるため、このメソッドを呼び出す必要はありません。 このメソッドは、主に特別な状況やテストで使用されます。 |

参考：[ガベージコレクションの条件](https://docs.microsoft.com/ja-jp/dotnet/standard/garbage-collection/fundamentals#conditions-for-a-garbage-collection)

## 参考

-   [ガベージ コレクションの基礎](https://docs.microsoft.com/ja-jp/dotnet/standard/garbage-collection/fundamentals)
-   [Understanding the managed heap](https://docs.unity3d.com/Manual/BestPracticeUnderstandingPerformanceInUnity4-1.html)
-   [.NETメモリ管理の概念](https://pleiades.io/help/dotmemory/NET_Memory_Management_Concepts.html#)
