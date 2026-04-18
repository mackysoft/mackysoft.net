---
title: "【Roguelike】隨機選出並生成敵人【C#】"
description: "預計在 Treasure Rogue 中更新的「改良關卡生成演算法」已經告一段落，這篇文章會附上程式碼，詳細解說它的實作。"
publishedAt: "2020-06-18T22:29:58+09:00"
updatedAt: "2020-06-18T22:42:27+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
  - "unity"
---

## 前言

接下來預定會更新到 [《Treasure Rogue》](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue) 的內容之一，也就是 **「改良關卡生成演算法」**，目前已經告一段落，所以這篇文章會附上細部程式碼來解說它的實作。

在那之前，我想先稍微說明一下，這次的改良到底是想解決什麼問題。

## 「每次玩起來都差不多」的問題

《Treasure Rogue》是一款 Roguelike 遊戲。

但是目前這款遊戲有個問題，就是「每次遊玩都會變得很相似」。

像是「第一個關卡會出現盜賊，下一個關卡會出現盜賊和狼……」這樣，**因為出現的敵人組合是固定的。**

隨機的只有敵人數量，敵人的組合本身不會改變。

**結果就是，明明是 Roguelike，玩起來卻變得很單調。**

這次「改良關卡生成演算法」的更新中，我為了解決這個問題，加入了以下規格。

-   生成的敵人會隨機選出
-   越是近期沒有生成過的敵人，被選中的機率越高
-   順便用 `AnimationCurve` 來控制各關卡的難度

## 程式碼

### FieldObject

這是附加在想要生成的敵人（物件）上的元件。

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

<table><tbody><tr><td>Strength</td><td>該物件的強度。例如，若難度是 3、Strength 是 1，就最多能生成 3 個該物件。</td></tr><tr><td>MinDifficulty</td><td>該物件開始會出現的最低難度。這是為了避免強敵在前期就被生成。</td></tr><tr><td>MaxSpawnRatio</td><td>在整體難度中，該物件所能占據的最大比例。例如，若難度是 3、MaxSpawnRatio 是 0.5，則該物件最多只能占用 1.5 的難度額度。</td></tr></tbody></table>

### LevelContents

LevelContents 是一個「以關卡中已生成的 FieldObject 為鍵、以其數量為值」來保存資料的類別。

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

<table><tbody><tr><td>Contents</td><td>關卡中已生成的 FieldObject 與其數量所組成的字典。</td></tr><tr><td>Increment</td><td>在物件生成時呼叫。</td></tr><tr><td>GetDifficulty</td><td>回傳 Contents 中 Strength 的總和（也就是難度）。</td></tr></tbody></table>

### LevelContext

它會作為引數傳給「實際執行關卡生成的函式」。

裡面裝著為了進行考慮難度的關卡生成所需的資訊，例如「該關卡被要求的難度」與「至今各關卡的 LevelContents」等等。

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

<table><tbody><tr><td>RequiredDifficulty</td><td>該關卡所要求的難度。</td></tr><tr><td>CurrentContents</td><td>該關卡目前的 LevelContents。</td></tr><tr><td>EverContentsStack</td><td>至今各關卡的 LevelContents 歷史紀錄。</td></tr><tr><td>GetRemainingDifficulty</td><td>回傳從關卡要求的難度中，扣掉目前 CurrentContents 難度後的值。</td></tr></tbody></table>

### FieldManager

這是在《Treasure Rogue》中負責管理無盡縱向長地圖的類別。

下面這段程式碼，是與「用 `AnimationCurve` 控制各關卡難度」相關的一部分摘錄。

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
			// 計算即將生成之關卡的難度
			float difficulty = m_LevelDifficultyCurve.Evaluate(m_TotalLevelCount.Value) * m_BaseLevelDifficulty;
			m_TotalLevelCount.Value++;
			Debug.Log($"Time: {m_TotalLevelCount.Value}, Base Difficulty: {m_BaseLevelDifficulty}, Difficulty: {difficulty}");

			// 生成場地
			yield return GenerateField(fieldData,difficulty);
			yield return GenerateField(goalField,0f);

			// 省略

		}
	}

	IEnumerator GenerateField (FieldDataBase fieldData,float difficulty) {
		// 建立新場地的處理很長，這裡省略
		IField field = ...

		// 建立生成關卡所需的 LevelContext
		var context = new LevelContext(difficulty,m_EverContentsStack);

		// 把新 LevelContext 的 Contents 加入至今的 LevelContents 歷史紀錄
		m_EverContentsStack.Add(context.CurrentContents);

		return field.Generate(context);
	}
}
```

<table><tbody><tr><td>BaseLevelDifficulty</td><td>關卡的基礎難度。</td></tr><tr><td>LevelDifficultyCurve</td><td>會回傳套用到 BaseLevelDifficulty 上之倍率的 AnimationCurve。例如，若 BaseLevelDifficulty 是 3、LevelDifficultyCurve 回傳 2，則該關卡難度就是 6。</td></tr><tr><td>EverContentsStack</td><td>至今各關卡的 LevelContents 歷史紀錄。</td></tr><tr><td>TotalLevelCount</td><td>目前為止已生成的關卡數量。</td></tr></tbody></table>

### WeightedMultiSpawnLevelProcessor

這次的重頭戲！

這個類別會執行「選出敵人並生成」的處理。因為它是實作在地圖生成演算法之上的，所以如果先看下面這篇文章，應該會比較容易理解。

參考：[關於 Roguelike 地圖生成演算法的解說](/articles/roguelike-map-generation-algorithm/)

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

		// 生成帶有權重的敵人集合
		Dictionary<FieldObject,float> weightedContents = m_FieldObjects
			.Where(e => (e != null) && (difficulty >= e.MinDifficulty))
			.ToDictionary(e => e,e => k_DefaultWeight);
		foreach (FieldObject element in context.EverContentsStack.SelectMany(x => m_FieldObjects.Except(x.Contents.Keys))) {
			weightedContents[element] += k_WeightIncrement;
		}
		Debug.Log("Contents Weight:\n" + string.Join("\n",weightedContents.Select(x => $"{x.Key.name}: {x.Value} weight")));

		// 選出要生成的敵人，並決定各自的數量
		Dictionary<FieldObject,int> contents = new Dictionary<FieldObject,int>();
		float totalDifficulty = 0f;
		while ((weightedContents.Count > 0) && (totalDifficulty < difficulty)) {
			float remainingDefficulty = difficulty - totalDifficulty;

			// 選出敵人
			FieldObject element = weightedContents
				.Where(x => x.Key.Strength <= remainingDefficulty)
				.WeightedSelect(x => x.Value).Key;

			// 如果 element 為 null，就表示在難度額度上已經沒有空間再生成敵人了
			if (element == null) {
				break;
			}

			// 根據難度決定敵人數量
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

		// 生成敵人
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

## 相關文章

-   [關於 Roguelike 地圖生成演算法的解說](/articles/roguelike-map-generation-algorithm/)
-   [實作帶權重的隨機選取【C#】](/weighted-random/)
-   [讓遊戲變得有趣的「對比」【遊戲設計】](/articles/gamedesign-contrast-cedec2018/)
