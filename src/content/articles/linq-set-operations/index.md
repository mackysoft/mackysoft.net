---
title: "【C#】Linqで集合演算（Union, Concat, Intersect, Except, Distinct）"
description: "和集合や差集合と云った、いわゆる「集合演算」を調べていたのですが、「そんな専門用語使われても分かんねーよ！」となったので、自分なりに分かりやすい言葉で解説します。 演算 説明 和集合（Union） コレクションAとコレク … 【C#】Linqで集合演算（Union, Concat, Intersect, Except, Distinct）"
publishedAt: "2020-06-07T19:11:00+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "csharp"
---

和集合や差集合と云った、いわゆる「集合演算」を調べていたのですが、**「そんな専門用語使われても分かんねーよ！」**となったので、自分なりに分かりやすい言葉で解説します。

| 演算 | 説明 |
| --- | --- |
| 和集合（[Union](https://docs.microsoft.com/ja-jp/dotnet/api/system.linq.enumerable.union?view=netcore-3.1)） | コレクションAとコレクションB、両方の要素を含んだものを返します。（重複する要素を取り除きます） |
| 和集合（[Concat](https://docs.microsoft.com/ja-jp/dotnet/api/system.linq.enumerable.concat?view=netcore-3.1)） | コレクションAとコレクションB、両方の要素を含んだものを返します。（重複する要素を取り除かない） |
| 積集合（[Intersect](https://docs.microsoft.com/ja-jp/dotnet/api/system.linq.enumerable.intersect?view=netcore-3.1)） | コレクションAとコレクションB、両方に含まれる要素のみを返します。 |
| 差集合（[Except](https://docs.microsoft.com/ja-jp/dotnet/api/system.linq.enumerable.except?view=netcore-3.1)） | コレクションAから、コレクションBの要素を取り除いたものを返します。 |
| 一意な集合（[Distinct](https://docs.microsoft.com/ja-jp/dotnet/api/system.linq.enumerable.distinct?view=netcore-3.1)） | コレクションから重複する要素を取り除いたものを返します。 |

## 和集合（Union, Concat）

コレクションAとコレクションB、両方の要素を含んだものを返します。

Unionは重複する要素を取り除きますが、Concatは重複する要素を取り除かない（コレクションAの後ろにコレクションBを結合するだけ）です。

```cs

int[] colloctionA = new int[] { 1, 2, 3, 4, 5 };
int[] collectionB = new int[] { 4, 5, 6, 7, 8, 9 };

// { 1, 2, 3, 4, 5, 6, 7, 8, 9 }
IEnumerable<int> unionEnumerable = collectionA.Union(collectionB);

// { 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9}
IEnumerable<int> concatEnumerable = collectionA.Concat(collectionB);
```

## 積集合（Intersect）

コレクションAとコレクションB、両方に含まれる要素のみを返します。

```cs

int[] colloctionA = new int[] { 1, 2, 3, 4, 5 };
int[] collectionB = new int[] { 2, 4 };

// { 2, 4 }
IEnumerable<int> intersectEnumerable = collectionA.Intersect(collectionB);
```

## 差集合（Except）

コレクションAから、コレクションBの要素を取り除いたものを返します。

```cs

int[] colloctionA = new int[] { 1, 2, 3, 4, 5 };
int[] collectionB = new int[] { 2, 4 };

// { 1, 3, 5 }
IEnumerable<int> exceptEnumerable = collectionA.Except(collectionB);
```

## 一意な集合（Distinct）

コレクションから重複する要素を取り除いたものを返します。

```cs

int[] colloction = new int[] { 1, 2, 2, 3, 3, 4, 4, 4, 5 };

// { 1, 2, 3, 4, 5 }
IEnumerable<int> distinctEnumerable= collectionA.Distinct();
```

## 参考

-   [LINQの集合演算](https://qiita.com/kazuhirox/items/afa154232e636c9ca415)
-   [和集合、積集合、差集合を求める](https://qiita.com/nkojima/items/575a1e5879d62441662d)
-   [Linq, 集合の計算](http://blog.livedoor.jp/nanoris/archives/51883318.html)
