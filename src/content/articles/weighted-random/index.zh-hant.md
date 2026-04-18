---
title: "實作加權隨機選擇【C#】"
description: "有時候，我們想要的不是完全均勻的隨機，而是會依照各元素的 Weight（權重）改變被選中機率的隨機選擇，例如抽卡或道具掉落率。本文會介紹一種在 C# 中實作 WeightedRandom 的方法。"
---

## 前言

有時候，我們想實作的不是完全均勻的隨機，而是會依照各元素的 Weight（權重）改變被選中機率的隨機選擇。像是抽卡或道具掉落率，就是這種情況。

本文會介紹這種「WeightedRandom」的實作方式。

## 使用範例

先來看看下面這個簡單的 WeightedRandom 使用範例。

```cs

public class WeightedItem {
	public string id;
	public float weight;
}

public class WeightedSelector : MonoBehaviour {

	public List<WeightedItem> items = new List<WeightedItem>();

	public void Select () {
		WeightedItem selectedItem = items[items.WeightedIndex(item => item.weight)];
		Debug.Log(selectedItem.id);
	}
}
```

這樣就能用一行程式碼完成加權隨機選擇。

## WeightedRandom 的程式碼

以下就是實作 WeightedRandom 的程式碼。

```cs

using System;
using System.Linq;
using System.Collections.Generic;

using Random = UnityEngine.Random;

public static class WeightedRandom {

	public static int WeightedIndex (this IEnumerable<float> source) {
		return WeightedIndex(source,Random.value);
	}

	public static int WeightedIndex (this IEnumerable<float> source,float value) {
		float[] weights = source.ToArray();

		float total = weights.Sum(x => x);
		if (total <= 0f) {
			return -1;
		}

		int i = 0;
		float w = 0f;
		foreach (float weight in weights) {
			w += weight / total;
			if (value <= w) {
				return i;
			}
			i++;
			}
		return -1;
	}

	public static int WeightedIndex<T> (this IEnumerable<T> source,float value,Func<T,float> weightSelector) {
		return source
			.Select(x => weightSelector.Invoke(x))
			.WeightedIndex(value);
	}

	public static int WeightedIndex<T> (this IEnumerable<T> source,Func<T,float> weightSelector) {
		return WeightedIndex(source,Random.value,weightSelector);
	}

}
```

## 示意圖

看一下下面這張圖，會比較容易理解 WeightedRandom 實際上在做什麼。

![](./cover.jpg)

## WeightedSelect 函式（補記：2020/06/06）

只有 WeightedIndex 的話，當你想取得的不是索引而是元素本身時，就得多做一步，使用上不太方便。因此我另外實作了一個能直接回傳元素型別的 WeightedSelect 函式。

```cs

public static class WeightedRandom {

	// omitted

	public static T WeightedSelect<T> (this IEnumerable<T> source,Func<T,float> weightSelector) {
		int index = WeightedIndex(source,weightSelector);
		return (index >= 0) ? source.ElementAt(index) : default;
	}
}
```

## 結語

我自己實際開發的遊戲 [Treasure Rogue](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue) 也有用到它，例如用在敵人的掉落物，以及寶箱中道具的抽選上。
