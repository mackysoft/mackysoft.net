---
title: "Spawning Random Enemies in a Roguelike [C#]"
description: "The 'improved level generation algorithm' update for Treasure Rogue is now complete, so this article walks through the implementation in detail with code."
publishedAt: "2020-06-18T22:29:58+09:00"
updatedAt: "2020-06-18T22:42:27+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
  - "unity"
---

## Introduction

The upcoming update for [Treasure Rogue](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue), **"improved level generation algorithm"**, has finally been completed, so this article explains the implementation in detail with code.

[At last, I finished implementing the system that controls difficulty with AnimationCurve. The problem where enemy selection in the roguelike was not random has been resolved, and the game is a little more fun now! — Makihiro @ Treasure Rogue Release! (@makihiro_dev) June 18, 2020](/%E3%82%88%E3%81%86%E3%82%84%E3%81%8FAnimationCurve%E3%81%A7%E9%9B%A3%E6%98%93%E5%BA%A6%E3%82%92%E5%88%B6%E5%BE%A1%E3%81%99%E3%82%8B%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%AE%E5%AE%9F%E8%A3%85%E3%81%8C%E4%B8%80%E6%AE%B5%E8%90%BD%E3%81%97%E3%81%9F%EF%BD%9E%E3%80%82%E3%83%AD%E3%83%BC%E3%82%B0%E3%83%A9%E3%82%A4%E3%82%AF%E3%81%AA%E3%81%AE%E3%81%AB%E6%95%B5%E3%81%AE%E9%81%B8%E5%87%BA%E3%81%8C%E3%83%A9%E3%83%B3%E3%83%80%E3%83%A0%E3%81%A7%E8%A1%8C%E3%82%8F%E3%82%8C%E3%81%AA%E3%81%84%E5%95%8F%E9%A1%8C%E3%81%8C%E8%A7%A3%E6%B6%88%E3%81%95%E3%82%8C%E3%81%A6%E5%B0%91%E3%81%97%E9%9D%A2%E7%99%BD%E3%81%8F%E3%81%AA%E3%81%A3%E3%81%9F%EF%BC%81%E2%80%94%20Makihiro@%E3%80%8ETreasure%20Rogue%E3%80%8F%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%EF%BC%81%20\(@makihiro_dev\)%20June%2018,%202020/)

Before that, I want to briefly explain what this improvement is trying to achieve.

## The "Every Run Feels Too Similar" Problem

Treasure Rogue is a roguelike game.

However, one of its current problems is that every run feels too similar.

The game currently works like this: "the first level has thieves, the next level has thieves and wolves, and so on." In other words, **the pattern of enemies is fixed.**

Only the number of enemies is random; the enemy lineup itself never changes.

**As a result, the roguelike ends up feeling repetitive even though it is supposed to be random.**

In this "improved level generation algorithm" update, I added the following features to solve that problem:

-   Enemies are selected at random when they are generated
-   Enemies that have not appeared recently are more likely to be selected
-   Difficulty for each level is also controlled with `AnimationCurve`

## Code

### FieldObject

This component is attached to the object you want to spawn.

```cs

using UnityEngine;

public class FieldObject : MonoBehaviour {

	[SerializeField]
	float m_Strength = 1f;

	[SerializeField]
	float m_MinDifficulty = 0f;

	[SerializeField, Range(0f,1f)]
	float m_MaxSpawnRatio = 1f;

	public float Strength => m_Strength;

	public float MinDifficulty => m_MinDifficulty;

	public float MaxSpawnRatio => m_MaxSpawnRatio;

}
```

<table><tbody><tr><td>Strength</td><td>The object's strength. For example, if the difficulty is 3 and Strength is 1, you can spawn up to three of that object.</td></tr><tr><td>MinDifficulty</td><td>The minimum difficulty at which the object can appear. This prevents strong enemies from spawning early in the game.</td></tr><tr><td>MaxSpawnRatio</td><td>The maximum portion of the difficulty that the object can occupy. For example, if the difficulty is 3 and MaxSpawnRatio is 0.5, that object can occupy only 1.5 difficulty points.</td></tr></tbody></table>

### LevelContents

`LevelContents` is a class that stores the number of generated `FieldObject`s in a level, using each spawned `FieldObject` as the key.

```cs

using System.Linq;
using System.Collections.Generic;

public interface IReadOnlyLevelContents {
	IReadOnlyDictionary<FieldObject,int> Contents { get; }
	float GetDifficulty ();
}

public class LevelContents : IReadOnlyLevelContents {

	readonly Dictionary<FieldObject,int> m_Contents;

	public IReadOnlyDictionary<FieldObject,int> Contents => m_Contents;

	public LevelContents () {
		m_Contents = new Dictionary<FieldObject,int>();
	}

	public void Increment (FieldObject fieldObject) {
		m_Contents.SetValue(fieldObject,1);
	}

	public float GetDifficulty () => m_Contents.Sum(pair => pair.Key.Strength * pair.Value);

}
```

<table><tbody><tr><td>Contents</td><td>A dictionary of the `FieldObject`s generated in the level and their counts.</td></tr><tr><td>Increment</td><td>Call this when an object spawns.</td></tr><tr><td>GetDifficulty</td><td>Returns the total Strength value of `Contents` (that is, the difficulty).</td></tr></tbody></table>

### LevelContext

This is passed as an argument to the function that actually generates a level.

It contains everything needed for difficulty-aware level generation, such as the required difficulty for the level and the `LevelContents` from previous levels.

```cs

using System.Linq;
using System.Collections.Generic;

public class LevelContext {

	readonly LevelContents[] m_EverContentsStack;

	public float RequiredDifficulty { get; }

	public LevelContents CurrentContents { get; } = new LevelContents();

	public IReadOnlyList<IReadOnlyLevelContents> EverContentsStack => m_EverContentsStack;

	public LevelContext (float requiredDifficulty,IEnumerable<LevelContents> everContentsStack) {
		RequiredDifficulty = requiredDifficulty;
		m_EverContentsStack = everContentsStack.ToArray();
	}

	public float GetRemainingDifficulty () {
		return RequiredDifficulty - CurrentContents.GetDifficulty();
	}
}
```

<table><tbody><tr><td>RequiredDifficulty</td><td>The difficulty required for the level.</td></tr><tr><td>CurrentContents</td><td>The current `LevelContents` for the level.</td></tr><tr><td>EverContentsStack</td><td>History of `LevelContents` from previous levels.</td></tr><tr><td>GetRemainingDifficulty</td><td>Returns the required level difficulty minus the difficulty of the current `LevelContents`.</td></tr></tbody></table>

### FieldManager

The manager for Treasure Rogue's endless vertical map.

The code below is an excerpt related to controlling the difficulty of each level with `AnimationCurve`.

```cs

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UniRx;

public class FieldManager : SingletonMonoBehaviour<FieldManager> {

	[SerializeField]
	float m_BaseLevelDifficulty;

	[SerializeField]
	AnimationCurve m_LevelDifficultyCurve = AnimationCurve.Constant(0f,10f,1f);

	readonly List<LevelContents> m_EverContentsStack = new List<LevelContents>();

	readonly ReactiveProperty<int> m_TotalLevelCount = new ReactiveProperty<int>();

	protected override void Awake () {
		m_LevelDifficultyCurve.preWrapMode = WrapMode.Loop;
		m_LevelDifficultyCurve.postWrapMode = WrapMode.Loop;
	}

	public IObservable<Unit> GenerateLevel (FieldDataBase fieldData) {
		var onCompleted = new AsyncSubject<Unit>();
		Observable.FromCoroutine(GenerateLevelCoroutine).Subscribe(onCompleted);
		return onCompleted;

		IEnumerator GenerateLevelCoroutine () {
			// Calculate the difficulty for the level to be generated
			float difficulty = m_LevelDifficultyCurve.Evaluate(m_TotalLevelCount.Value) * m_BaseLevelDifficulty;
			m_TotalLevelCount.Value++;
			Debug.Log($"Time: {m_TotalLevelCount.Value}, Base Difficulty: {m_BaseLevelDifficulty}, Difficulty: {difficulty}");

			// Generate the field
			yield return GenerateField(fieldData,difficulty);
			yield return GenerateField(goalField,0f);

			// omitted

		}
	}

	IEnumerator GenerateField (FieldDataBase fieldData,float difficulty) {
		// The code that creates a new field is long, so it is omitted here
		IField field = ...

		// Create the LevelContext needed to generate the level
		var context = new LevelContext(difficulty,m_EverContentsStack);

		// Add the new LevelContext contents to the LevelContents history
		m_EverContentsStack.Add(context.CurrentContents);

		return field.Generate(context);
	}
}
```

<table><tbody><tr><td>BaseLevelDifficulty</td><td>The base difficulty for the level.</td></tr><tr><td>LevelDifficultyCurve</td><td>An `AnimationCurve` that returns a multiplier applied to `BaseLevelDifficulty`. For example, if `BaseLevelDifficulty` is 3 and `LevelDifficultyCurve` returns 2, the level difficulty becomes 6.</td></tr><tr><td>EverContentsStack</td><td>History of `LevelContents` from previous levels.</td></tr><tr><td>TotalLevelCount</td><td>The number of levels generated so far.</td></tr></tbody></table>

### WeightedMultiSpawnLevelProcessor

The main event!

This class performs the work of "selecting enemies and spawning them." Since it is built on top of the map generation algorithm, the article below should make it easier to understand.

Reference: [Explaining a Roguelike Map Generation Algorithm](/articles/roguelike-map-generation-algorithm/)

```cs

using System;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class WeightedMultiSpawnLevelProcessor : ILevelProcessor {

	const float k_DefaultWeight = 1f;
	const float k_WeightIncrement = 10f;

	[SerializeField]
	FieldObject[] m_FieldObjects = Array.Empty<FieldObject>();

	public IEnumerator Process (IField field,LevelContext context) {
		float difficulty = context.GetRemainingDifficulty();

		// Generate the weighted collection of enemies
		Dictionary<FieldObject,float> weightedContents = m_FieldObjects
			.Where(e => (e != null) && (difficulty >= e.MinDifficulty))
			.ToDictionary(e => e,e => k_DefaultWeight);
		foreach (FieldObject element in context.EverContentsStack.SelectMany(x => m_FieldObjects.Except(x.Contents.Keys))) {
			weightedContents[element] += k_WeightIncrement;
		}
		Debug.Log("Contents Weight:\n" + string.Join("\n",weightedContents.Select(x => $"{x.Key.name}: {x.Value} weight")));

		// Select the enemies to spawn and decide how many of each to generate
		Dictionary<FieldObject,int> contents = new Dictionary<FieldObject,int>();
		float totalDifficulty = 0f;
		while ((weightedContents.Count > 0) && (totalDifficulty < difficulty)) {
			float remainingDefficulty = difficulty - totalDifficulty;

			// Select an enemy
			FieldObject element = weightedContents
				.Where(x => x.Key.Strength <= remainingDefficulty)
				.WeightedSelect(x => x.Value).Key;

			// If element is null, there is no room left in the difficulty budget to spawn more enemies.
			if (element == null) {
				break;
			}

			// Determine the number of enemies based on the difficulty
			int maxSpawnableQuantity = Mathf.FloorToInt(remainingDefficulty / element.Strength);
			int maxQuantity = Mathf.FloorToInt(difficulty / element.Strength * element.MaxSpawnRatio);
			int quantity = Random.Range(0,Mathf.Min(maxSpawnableQuantity,maxQuantity) + 1);

			if (quantity > 0) {
				weightedContents.Remove(element);
				contents.Add(element,quantity);
				totalDifficulty += element.Strength * quantity;
			}
			yield return null;
		}

		// Spawn the enemies
		foreach (var content in contents) {
			yield return new MultiSpawnLevelProcessor(
				prefab: content.Key,
				quantity: content.Value,
				direction: SpawnDirection.Random,
				securePath: true
			).Process(field,context);
		}
	}
}
```

## Related Articles

-   [Explaining a Roguelike Map Generation Algorithm](/articles/roguelike-map-generation-algorithm/)
-   [Implementing Weighted Random Selection in C#](/weighted-random/)
-   [How Contrast Makes Games Fun [Game Design]](/articles/gamedesign-contrast-cedec2018/)
