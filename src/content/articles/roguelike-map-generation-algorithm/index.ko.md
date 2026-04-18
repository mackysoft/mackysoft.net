---
title: "로그라이크의 맵 생성 알고리즘 해설"
description: "Treasure Rogue라는 로그라이크 게임을 만들면서 구현한 맵 생성 알고리즘을 설명합니다. Treasure Rogue는 세로로 긴 맵을 생성하지만, 기본 구현은 미스터리 던전 스타일의 맵 생성에도 활용할 수 있습니다."
publishedAt: "2020-06-02T20:19:41+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "treasure-rogue"
  - "unity"
cover: "./cover.png"
coverAlt: "로그라이크의 맵 생성 알고리즘 해설의 글 이미지"
---

## 소개

[Treasure Rogue](/games/treasure-rogue/)는 제가 만든 로그라이크 게임이며, 이 글에서는 그때 구현한 맵 생성 알고리즘을 설명합니다.

Treasure Rogue는 세로로 긴 맵을 생성하지만, 기본 구현은 미스터리 던전 스타일의 맵 생성에도 사용할 수 있다고 생각합니다.

## 맵 생성의 기본 구현

구체적인 구현을 보기 전에, 먼저 전체 흐름을 대략 확인해 봅시다.

### ILevelProcessor

`ILevelProcessor` 인터페이스는 맵에 오브젝트를 생성하는 것처럼, 맵 생성 중에 작업을 수행하는 클래스가 구현합니다.

```cs

public interface ILevelProcessor {

	// 필드에 대해 비동기 처리를 수행한다
	IEnumerator Process (IField field);

}
```

`ILevelProcessor`의 구체적인 구현은 나중에 설명합니다.

### 맵을 생성하는 처리

`ILevelProcessor` 컬렉션을 순서대로 순회하며 `Process`를 호출하면, 오브젝트 생성 같은 처리를 수행할 수 있습니다.

```cs

public class Field : IField {

	// 생략

	// 맵을 생성하는 함수
	IEnumerator GenerateInternal () {
		m_IsGenerating.Value = true;

		yield return GenerateField();

		foreach (ILevelProcessor processor in Processors) {
			yield return processor.Process(this);
		}

		m_IsGenerating.Value = false;
	}
}
```

## 구체적인 구현

이제 전체 흐름을 대략 파악했으니, 실제 구현을 살펴보겠습니다.

### 1. 맵의 바탕 생성

먼저 맵의 바탕을 생성합니다.

![](./ClearField.jpg)

### 2. 경로 확보

무작위로 오브젝트를 배치하면 플레이어가 지나갈 수 없는 맵이 생성될 수 있으므로, 먼저 **오브젝트를 생성하면 안 되는 위치**를 정해 둡니다.

![](./SecurePathProcessor-2.jpg)

#### 실제 코드

```cs

[SerializeField]
public class SecurePathProcessor : ILevelProcessor {

	public static SecurePathProcessor Instance { get; } = new SecurePathProcessor();

	public IEnumerator Process (IField field) {
		yield return FieldManager.Instance.GraphUpdate();
		yield return field.SecurePath(to: new Vector3Int(
			Random.Range(0,field.Bounds.size.x),
			0,
			field.Bounds.zMax
		));
	}
}
```

`SecurePathProcessor`는 `ILevelProcessor`를 구현합니다. 즉, 맵 생성 중 루프에서 `Process`가 호출됩니다.

`SecurePath`는 `field`에 등록된 플레이어로부터 지정한 위치까지 무작위 경로를 생성하고, 그 경로에는 오브젝트가 생성되지 않도록 막습니다.

### 3. 접근 가능한 오브젝트 생성

이제 남은 것은 적과 보물상자 같은 "접근 가능한 오브젝트"와 장애물을 생성하는 일입니다. 먼저 접근 가능한 오브젝트부터 생성합니다.

장애물을 생성하기 전에, 이 접근 가능한 오브젝트들까지의 경로를 확보해야 하기 때문입니다.

![](./GenerateAccessableObject.jpg)

#### 실제 코드

```cs

[Serializable]
public class MultiSpawnLevelBuilder : ILevelProcessor {

	// 오브젝트를 너무 많이 생성하면 경로 확보 처리(경로 탐색)가 지나치게 무거워져서 게임이 멈출 수 있다.
	// 그래서 생성 수가 10을 넘으면 경로 확보를 하지 않는다.
	const int k_SecurePathAcceptableQuantity = 10;

	[SerializeField]
	FieldObject m_Prefab;

	[SerializeField]
	FieldObjectQuantitiy m_Quantity = new FieldObjectQuantitiy(1);

	[SerializeField]
	bool m_SecurePath;

	public IEnumerator Process (IField field) {
		// 오브젝트를 생성하고 경로를 확보하는 처리
		// 길어서 생략
	}
}
```

`MultiSpawnLevelBuilder` 역시 `ILevelProcessor`를 구현합니다.

### 4. 장애물 생성

마지막으로 장애물을 생성합니다. 확보한 경로에는 장애물이 생성되지 않습니다.

![](./GenerateObstacle-1.jpg)

코드는 "접근 가능한 오브젝트 생성"과 같은 것을 사용합니다. 다만 이 경우는 장애물이므로 경로 확보 처리를 하지 않습니다.

## 마무리

이것이 _Treasure Rogue_에서 사용한 맵 생성 알고리즘의 기본 흐름입니다.

생성하고 싶은 오브젝트와 게임 규칙에 맞게 각 `ILevelProcessor`를 바꿔 끼우면, 같은 구조를 유지한 채 여러 종류의 맵 생성에 활용할 수 있습니다.
