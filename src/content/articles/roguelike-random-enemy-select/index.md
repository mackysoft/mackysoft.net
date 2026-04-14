---
title: "【ローグライク】ランダムで敵を選出して生成する【C#】"
description: "はじめに これからアップデートを行う予定の『Treasure Rogue』の更新の一つである「レベル生成アルゴリズムの改善」が一段落したので、この記事ではその実装についての細かいコード付きで解説していきます。 まず、この … 【ローグライク】ランダムで敵を選出して生成する【C#】"
publishedAt: "2020-06-18T22:29:58+09:00"
updatedAt: "2020-06-18T22:42:27+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
  - "unity"
---

## はじめに

これからアップデートを行う予定の[『Treasure Rogue』](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue)の更新の一つである **「レベル生成アルゴリズムの改善」** が一段落したので、この記事ではその実装についての細かいコード付きで解説していきます。

[ようやくAnimationCurveで難易度を制御するシステムの実装が一段落した～。ローグライクなのに敵の選出がランダムで行われない問題が解消されて少し面白くなった！— Makihiro@『Treasure Rogue』リリース！ (@makihiro\_dev) June 18, 2020](/%E3%82%88%E3%81%86%E3%82%84%E3%81%8FAnimationCurve%E3%81%A7%E9%9B%A3%E6%98%93%E5%BA%A6%E3%82%92%E5%88%B6%E5%BE%A1%E3%81%99%E3%82%8B%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%81%AE%E5%AE%9F%E8%A3%85%E3%81%8C%E4%B8%80%E6%AE%B5%E8%90%BD%E3%81%97%E3%81%9F%EF%BD%9E%E3%80%82%E3%83%AD%E3%83%BC%E3%82%B0%E3%83%A9%E3%82%A4%E3%82%AF%E3%81%AA%E3%81%AE%E3%81%AB%E6%95%B5%E3%81%AE%E9%81%B8%E5%87%BA%E3%81%8C%E3%83%A9%E3%83%B3%E3%83%80%E3%83%A0%E3%81%A7%E8%A1%8C%E3%82%8F%E3%82%8C%E3%81%AA%E3%81%84%E5%95%8F%E9%A1%8C%E3%81%8C%E8%A7%A3%E6%B6%88%E3%81%95%E3%82%8C%E3%81%A6%E5%B0%91%E3%81%97%E9%9D%A2%E7%99%BD%E3%81%8F%E3%81%AA%E3%81%A3%E3%81%9F%EF%BC%81%E2%80%94%20Makihiro@%E3%80%8ETreasure%20Rogue%E3%80%8F%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%EF%BC%81%20\(@makihiro_dev\)%20June%2018,%202020/)

まず、この改善で何をしようとしているのかを、少し話しておこうと思います。

## 「同じようなプレイが起きてしまう」問題

『Treasure Rogue』はローグライクゲームです。

しかし現在、このゲームの問題の一つに「毎回、同じようなプレイになってしまう」という問題があります。

「最初のレベルには盗賊が出て、次のレベルには盗賊と狼が出て…」という感じで、**出てくる敵のパターンが固定されているからです。**

ランダムなのは敵の数だけで、敵のパターンは変わりません。

**結果、ローグライクゲームのはずなのにプレイが単調になってしまいます。**

今回の「レベル生成アルゴリズムの改善」では、この問題を解決するために以下のような仕様を盛り込みました。

-   生成される敵はランダムに選出される
-   直近に生成されていない敵ほど、選出される確率が高くなる
-   ついでに、AnimationCurveで各レベルの難易度を制御する

## コード

### FieldObject

生成したい敵（オブジェクト）にアタッチするコンポーネントです。

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

<table><tbody><tr><td>Strength</td><td>そのオブジェクトの強さ。例えば、「難易度が3」で「Strengthが1」なら、そのオブジェクトを3つまで生成できる。</td></tr><tr><td>MinDifficulty</td><td>そのオブジェクトが出現するようになる最低難易度。強い敵が序盤に生成されてしまわないための対策。</td></tr><tr><td>MaxSpawnRatio</td><td>難易度の中での、そのオブジェクトの最高比率。例えば「難易度が3」で「MaxSpawnRatioが0.5」なら、そのオブジェクトが難易度で占めることができるのは、難易度1.5の分まで。</td></tr></tbody></table>

### LevelContents

LevelContentsは「レベルに生成されたFieldObjectをキーとして、その数を値として」保持するクラスです。

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

<table><tbody><tr><td>Contents</td><td>レベルに生成されたFieldObjectと、その数のディクショナリ。</td></tr><tr><td>Increment</td><td>オブジェクトがスポーンしたときに呼び出す。</td></tr><tr><td>GetDifficulty</td><td>ContentsのStrengthの総合値（難易度）を返す。</td></tr></tbody></table>

### LevelContext

「実際にレベル生成をする関数」に対する引数として渡されます。

「レベルに要求された難易度」「今までのレベルのLevelContents」など、難易度を考慮したレベル生成をするために必要な情報が詰まっています。

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

<table><tbody><tr><td>RequiredDifficulty</td><td>そのレベルに要求された難易度。</td></tr><tr><td>CurrentContents</td><td>そのレベルの現在のLevelContents。</td></tr><tr><td>EverContentsStack</td><td>今までのレベルのLevelContentsの履歴。</td></tr><tr><td>GetRemainingDifficulty</td><td>レベルに要求された難易度から、現在のLevelContentsの難易度を減算した値を返す。</td></tr></tbody></table>

### FieldManager

『TreasureRogue』における、エンドレスな縦長のマップを管理するクラスです。

以下のコードは、「AnimationCurveで各レベルの難易度を制御する」に関連するコードを一部抜粋したものです。

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
			// 生成するレベルの難易度を求める
			float difficulty = m_LevelDifficultyCurve.Evaluate(m_TotalLevelCount.Value) * m_BaseLevelDifficulty;
			m_TotalLevelCount.Value++;
			Debug.Log($"Time: {m_TotalLevelCount.Value}, Base Difficulty: {m_BaseLevelDifficulty}, Difficulty: {difficulty}");

			// フィールドを生成する
			yield return GenerateField(fieldData,difficulty);
			yield return GenerateField(goalField,0f);

			// 省略

		}
	}

	IEnumerator GenerateField (FieldDataBase fieldData,float difficulty) {
		// 新しいフィールドを作成する処理は長いので省略
		IField field = ...

		// レベルを生成するために必要なLevelContextを作成
		var context = new LevelContext(difficulty,m_EverContentsStack);

		// 新しく作成したLevelContextのContentsを今までのLevelContentsの履歴に追加
		m_EverContentsStack.Add(context.CurrentContents);

		return field.Generate(context);
	}
}
```

<table><tbody><tr><td>BaseLevelDifficulty</td><td>基本となるレベルの難易度。</td></tr><tr><td>LevelDifficultyCurve</td><td>BaseLevelDifficultyに適用する倍率を返すAnimationCurve。例えば、「BaseLevelDifficultyが3」で「LevelDifficultyCurveが2を返す」と、レベルの難易度は6になります。</td></tr><tr><td>EverContentsStack</td><td>今までのレベルのLevelContentsの履歴。</td></tr><tr><td>TotalLevelCount</td><td>今までに生成したレベルの数。</td></tr></tbody></table>

### WeightedMultiSpawnLevelProcessor

今回の本命！

このクラスが「敵を選出して生成する」という処理を行います。マップ生成アルゴリズムの上に実装している処理なので、以下の記事を見てもらえると理解しやすいと思います。

参考：[ローグライクのマップ生成アルゴリズムについて解説](/articles/roguelike-map-generation-algorithm/)

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

		// Weightedな敵のコレクションを生成する
		Dictionary<FieldObject,float> weightedContents = m_FieldObjects
			.Where(e => (e != null) && (difficulty >= e.MinDifficulty))
			.ToDictionary(e => e,e => k_DefaultWeight);
		foreach (FieldObject element in context.EverContentsStack.SelectMany(x => m_FieldObjects.Except(x.Contents.Keys))) {
			weightedContents[element] += k_WeightIncrement;
		}
		Debug.Log("Contents Weight:\n" + string.Join("\n",weightedContents.Select(x => $"{x.Key.name}: {x.Value} weight")));

		// 生成する敵の選出および、敵の数を決める
		Dictionary<FieldObject,int> contents = new Dictionary<FieldObject,int>();
		float totalDifficulty = 0f;
		while ((weightedContents.Count > 0) && (totalDifficulty < difficulty)) {
			float remainingDefficulty = difficulty - totalDifficulty;

			// 敵を選出する
			FieldObject element = weightedContents
				.Where(x => x.Key.Strength <= remainingDefficulty)
				.WeightedSelect(x => x.Value).Key;

			// elementがnullということは、難易度的に敵を生成する余裕が無くなったということ
			if (element == null) {
				break;
			}

			// 難易度に基づいて、敵の数を求める
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

		// 敵を生成する
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

## 関連記事

-   [ローグライクのマップ生成アルゴリズムについて解説](/articles/roguelike-map-generation-algorithm/)
-   [Weightedなランダムを実装する【C#】](/weighted-random/)
-   [ゲームを面白くする「コントラスト」【ゲームデザイン】](/articles/gamedesign-contrast-cedec2018/)

