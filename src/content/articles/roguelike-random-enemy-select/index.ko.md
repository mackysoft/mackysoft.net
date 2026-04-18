---
title: "【로그라이크】랜덤으로 적을 골라 생성하기【C#】"
description: "앞으로 업데이트할 예정인 Treasure Rogue의 '레벨 생성 알고리즘 개선' 작업이 일단락되어, 이 글에서는 그 구현을 코드와 함께 자세히 설명합니다."
publishedAt: "2020-06-18T22:29:58+09:00"
updatedAt: "2020-06-18T22:42:27+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
  - "unity"
---

## 소개

앞으로 업데이트할 예정인 [Treasure Rogue](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue)의 **"레벨 생성 알고리즘 개선"** 작업이 일단락되어, 이 글에서는 그 구현을 코드와 함께 자세히 설명합니다.

그 전에, 이번 개선이 무엇을 해결하려는지 먼저 간단히 이야기해 두고자 합니다.

## "매번 비슷하게 플레이된다"는 문제

Treasure Rogue는 로그라이크 게임입니다.

하지만 현재 이 게임에는 "매번 플레이가 비슷해진다"는 문제가 있습니다.

"첫 번째 레벨에는 도적이 나오고, 다음 레벨에는 도적과 늑대가 나온다"는 식으로, **등장하는 적의 패턴이 고정되어 있기 때문입니다.**

랜덤인 것은 적의 수뿐이고, 적의 조합 자체는 바뀌지 않습니다.

**결국 로그라이크인데도 랜덤성이 느껴지지 않고, 플레이가 반복적으로 느껴집니다.**

이번 "레벨 생성 알고리즘 개선"에서는 이 문제를 해결하기 위해 다음과 같은 기능을 넣었습니다.

-   생성되는 적을 무작위로 선택한다
-   최근에 등장하지 않은 적일수록 선택될 확률이 높아진다
-   각 레벨의 난이도는 `AnimationCurve`로 조절한다

## 코드

### FieldObject

생성하고 싶은 오브젝트에 붙이는 컴포넌트입니다.

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

<table><tbody><tr><td>Strength</td><td>오브젝트의 강도입니다. 예를 들어 난이도가 3이고 Strength가 1이라면, 그 오브젝트는 최대 3개까지 생성할 수 있습니다.</td></tr><tr><td>MinDifficulty</td><td>오브젝트가 등장하기 시작하는 최소 난이도입니다. 강한 적이 게임 초반에 생성되는 것을 막기 위한 장치입니다.</td></tr><tr><td>MaxSpawnRatio</td><td>난이도 중에서 해당 오브젝트가 차지할 수 있는 최대 비율입니다. 예를 들어 난이도가 3이고 MaxSpawnRatio가 0.5라면, 그 오브젝트가 차지할 수 있는 난이도는 1.5까지입니다.</td></tr></tbody></table>

### LevelContents

`LevelContents`는 레벨에 생성된 `FieldObject`의 수를, 각 `FieldObject`를 키로 삼아 저장하는 클래스입니다.

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

<table><tbody><tr><td>Contents</td><td>레벨에 생성된 `FieldObject`와 그 수로 이루어진 딕셔너리입니다.</td></tr><tr><td>Increment</td><td>오브젝트가 스폰될 때 호출합니다.</td></tr><tr><td>GetDifficulty</td><td>Contents의 Strength 총합, 즉 난이도를 반환합니다.</td></tr></tbody></table>

### LevelContext

실제로 레벨을 생성하는 함수에 인자로 전달됩니다.

해당 레벨에 요구되는 난이도와 지금까지의 레벨 `LevelContents` 같은, 난이도를 고려한 레벨 생성을 위해 필요한 정보가 들어 있습니다.

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

<table><tbody><tr><td>RequiredDifficulty</td><td>해당 레벨에 요구되는 난이도입니다.</td></tr><tr><td>CurrentContents</td><td>해당 레벨의 현재 `LevelContents`입니다.</td></tr><tr><td>EverContentsStack</td><td>지금까지의 레벨 `LevelContents` 기록입니다.</td></tr><tr><td>GetRemainingDifficulty</td><td>레벨에 요구된 난이도에서 현재 `LevelContents`의 난이도를 뺀 값을 반환합니다.</td></tr></tbody></table>

### FieldManager

Treasure Rogue의 끝없이 이어지는 세로형 맵을 관리하는 클래스입니다.

아래 코드는 `AnimationCurve`로 각 레벨의 난이도를 제어하는 부분을 발췌한 것입니다.

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
			// 생성할 레벨의 난이도를 계산한다
			float difficulty = m_LevelDifficultyCurve.Evaluate(m_TotalLevelCount.Value) * m_BaseLevelDifficulty;
			m_TotalLevelCount.Value++;
			Debug.Log($"Time: {m_TotalLevelCount.Value}, Base Difficulty: {m_BaseLevelDifficulty}, Difficulty: {difficulty}");

			// 필드를 생성한다
			yield return GenerateField(fieldData,difficulty);
			yield return GenerateField(goalField,0f);

			// 생략

		}
	}

	IEnumerator GenerateField (FieldDataBase fieldData,float difficulty) {
		// 새 필드를 만드는 처리는 길어서 생략한다
		IField field = ...

		// 레벨을 생성하는 데 필요한 LevelContext를 만든다
		var context = new LevelContext(difficulty,m_EverContentsStack);

		// 새로 만든 LevelContext의 Contents를 지금까지의 LevelContents 기록에 추가한다
		m_EverContentsStack.Add(context.CurrentContents);

		return field.Generate(context);
	}
}
```

<table><tbody><tr><td>BaseLevelDifficulty</td><td>레벨의 기본 난이도입니다.</td></tr><tr><td>LevelDifficultyCurve</td><td>`BaseLevelDifficulty`에 곱할 배율을 반환하는 `AnimationCurve`입니다. 예를 들어 `BaseLevelDifficulty`가 3이고 `LevelDifficultyCurve`가 2를 반환하면, 레벨 난이도는 6이 됩니다.</td></tr><tr><td>EverContentsStack</td><td>지금까지의 레벨 `LevelContents` 기록입니다.</td></tr><tr><td>TotalLevelCount</td><td>지금까지 생성된 레벨의 수입니다.</td></tr></tbody></table>

### WeightedMultiSpawnLevelProcessor

이번 글의 핵심입니다!

이 클래스가 "적을 골라 생성하는" 처리를 담당합니다. 맵 생성 알고리즘 위에 구현된 처리이므로, 아래 글을 먼저 보면 이해하기 쉽습니다.

참고: [로그라이크의 맵 생성 알고리즘 해설](/articles/roguelike-map-generation-algorithm/)

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

		// 가중치가 붙은 적 컬렉션을 생성한다
		Dictionary<FieldObject,float> weightedContents = m_FieldObjects
			.Where(e => (e != null) && (difficulty >= e.MinDifficulty))
			.ToDictionary(e => e,e => k_DefaultWeight);
		foreach (FieldObject element in context.EverContentsStack.SelectMany(x => m_FieldObjects.Except(x.Contents.Keys))) {
			weightedContents[element] += k_WeightIncrement;
		}
		Debug.Log("Contents Weight:\n" + string.Join("\n",weightedContents.Select(x => $"{x.Key.name}: {x.Value} weight")));

		// 생성할 적을 골라, 각 적을 몇 마리 생성할지 결정한다
		Dictionary<FieldObject,int> contents = new Dictionary<FieldObject,int>();
		float totalDifficulty = 0f;
		while ((weightedContents.Count > 0) && (totalDifficulty < difficulty)) {
			float remainingDefficulty = difficulty - totalDifficulty;

			// 적을 선택한다
			FieldObject element = weightedContents
				.Where(x => x.Key.Strength <= remainingDefficulty)
				.WeightedSelect(x => x.Value).Key;

			// element가 null이라는 것은, 난이도 여유가 더 이상 없어 적을 생성할 수 없다는 뜻이다
			if (element == null) {
				break;
			}

			// 난이도에 따라 적의 수를 정한다
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

		// 적을 생성한다
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

## 관련 글

-   [로그라이크의 맵 생성 알고리즘 해설](/articles/roguelike-map-generation-algorithm/)
-   [C#에서 가중치가 있는 랜덤 선택 구현하기](/weighted-random/)
-   [게임을 재미있게 만드는 "대비"【게임 디자인】](/articles/gamedesign-contrast-cedec2018/)
