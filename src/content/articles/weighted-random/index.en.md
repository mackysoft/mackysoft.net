---
title: "Implementing Weighted Random Selection [C#]"
description: "Sometimes you want random selection where each item has a different chance of being chosen based on its weight, such as gacha or item drop rates. This article shows one way to implement that with WeightedRandom."
cover: "./cover.jpg"
coverAlt: "Article image for Implementing Weighted Random Selection [C#]"
---

## Introduction

Sometimes you want to implement random selection where each item's weight changes how likely it is to be picked. Gacha and item drop rates are good examples.

This article shows how to implement "WeightedRandom".

## Usage Example

First, let's look at a simple usage example of WeightedRandom.

```cs

public class WeightedItem {
	public string id;
	public float weight;
}

public class WeightedSelector : MonoBehaviour {

	public List<WeightedItem> items = new List<WeightedItem>();

	public Select () {
		WeightedItem selectedItem = items[items.WeightedIndex(item => item.weight)];
		Debug.Log(selectedItem.id);
	}
}
```

Weighted random can be written in a single line.

## WeightedRandom Code

This is the code that implements WeightedRandom.

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

## Image

The image below makes it easier to understand what WeightedRandom is doing.

![](./cover.jpg)

## WeightedSelect Function (Added on 2020/06/06)

With WeightedIndex, I had to do a little extra work when I wanted to get the element itself instead of the index, so I added a WeightedSelect function that returns an element of the source type.

```cs

public static class WeightedRandom {

	// omitted

	public static T WeightedSelect<T> (this IEnumerable<T> source,Func<T,float> weightSelector) {
		int index = WeightedIndex(source,weightSelector);
		return (index >= 0) ? source.ElementAt(index) : default;
	}
}
```

## Closing Thoughts

I also use it in the game I developed, [Treasure Rogue](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue), to choose enemy drops and items from treasure chests.
