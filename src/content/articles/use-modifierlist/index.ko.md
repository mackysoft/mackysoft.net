---
title: "[Unity] ModifierList로 방어 버프 구현하기 [Modiferty]"
description: "Modiferty는 능력치 관리 라이브러리입니다. 아직 Modiferty의 개요가 익숙하지 않다면 아래 글을 함께 보면 이해하기 쉽습니다."
publishedAt: "2020-05-24T00:42:00+09:00"
updatedAt: "2020-05-24T15:10:23+09:00"
tags:
  - "modiferty"
  - "unity"
cover: "./cover.png"
coverAlt: "[Unity] ModifierList로 방어 버프 구현하기 [Modiferty]의 글 이미지"
---

## 소개

Modiferty는 능력치 관리 라이브러리입니다.

Modiferty의 개요가 아직 익숙하지 않다면, 아래 글을 먼저 보면 이해하기 쉽습니다.

[Modiferty로 게임 능력치 관리하기 [Unity]](/articles/modiferty-introduction/)

## ModifierList란?

`ModifiableProperty`가 개별 능력치의 값을 바꾸는 데 쓰인다면,

`ModifierList`는 **전달받은 값을 변형**할 수 있습니다.

예를 들어, 데미지를 실제로 적용하기 전에 먼저 가공하는 용도로 쓸 수 있습니다. (포켓몬으로 치면 "철벽", 드래곤 퀘스트로 치면 "스카라"에 가깝습니다.)

## 구체적인 구현 예시

이제 실제로 **"받는 피해를 줄이는 처리"** 를 구현해 보겠습니다.

### 1. ModifierList 선언하기

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// 캐릭터의 체력
	public int health = 3;

	// 들어오는 피해를 전처리하는 ModifierList
	public ModifierList<int> damageModifiers = new ModifierList<int>();

}
```

체력 타입이 `int`가 아니라 `float`라면 `ModifierList<float>`를 사용하면 됩니다.

이제 들어오는 피해를 줄일 준비가 끝났습니다.

### 2. ModifierList에 Modifier 추가하기

다음으로 캐릭터의 방어력을 올려 주는 아이템을 구현합니다.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class DefenseUpItem : MonoBehaviour {

	// 줄일 양
	public SubstractiveModifierInt substractDamageModifier = new SubstractiveModifierInt(amount: 1);

	void OnCollisionEnter (Collision collision) {
		Character target = collision.collider.GetComponentInParent<Character>();
		if (target != null) {
			// target.damageModifiers에 값을 1 줄여 주는 Modifier를 추가한다
			target.damageModifiers.Add(substractDamageModifier);
		}
	}
}
```

캐릭터가 이 DefenseUpItem과 충돌하면, `SubstractiveModifierInt`(값을 줄이는 Modifier)가 해당 캐릭터의 `damageModifiers`에 추가됩니다.

즉, 그 캐릭터가 받는 피해를 줄일 수 있습니다.

이 예시에서는 `SubstractiveModifierInt` 를 사용했지만, "피해를 10% 줄인다" 같은 처리를 구현하고 싶다면 `MultiplyModifier` 등을 사용할 수 있습니다.

### 3. 피해를 받는 처리

캐릭터가 피해를 받는 동작을 구현합니다.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// 캐릭터의 체력
	public int health = 3;

	// 들어오는 피해를 전처리하는 ModifierList
	public ModifierList<int> damageModifiers = new ModifierList<int>();

	public int attackPower = 2;

	// 피해를 받는 처리
	public void TakeDamage (Character attacker) {

		// 들어오는 피해에 damageModifiers를 적용한다
		health -= damageModifiers.Evaluate(attacker.attackPower);

	}

}
```

중요한 부분은 **`damageModifiers.Evaluate(attacker.attackPower)`** 입니다.

`ModifierList`의 `Evaluate` 함수는 `attacker.attackPower` 에 변형을 적용합니다.

방어하는 캐릭터가 DefenseUpItem의 효과를 받고 있었다면,

**`2` (공격하는 캐릭터의 공격력) - `1` (SubstractiveModifierInt의 감소량)**

실제로 받는 피해는 `1`이 됩니다.

### 4. ModifierList에서 Modifier 제거하기

"철벽"이나 "스카라"로 캐릭터를 영구 강화 상태로 둘 수는 없습니다. 효과를 해제할 때는 `ModifierList` 에서 Modifier를 삭제하면 됩니다.

기본적으로는 `List<T>`처럼 사용할 수 있고, 편리한 보조 함수도 제공됩니다.

```cs

// 특정 Modifier를 제거한다
damageModifiers.Remove(someModifier);

// 모든 Modifier를 제거한다.
damageModifiers.Clear();

// 타입이 일치하는 모든 Modifier를 제거한다.
// 이 경우 SubstractiveModifierInt 인스턴스를 모두 제거한다.
damageModifiers.RemoveAll<SubstractiveModifierInt>();

// 조건에 맞는 모든 Modifier를 제거한다.
// 이 경우 Amount가 3 이상인 SubstractiveModifierInt 인스턴스를 모두 제거한다.
damageModifiers.RemoveAll(modifier => {
	return (modifier is SubstractiveModifierInt result) && (result.Amount >= 3);
});

```

이렇게 해서 **"받는 피해를 줄이는 처리"** 구현이 끝났습니다.

## 마무리

Modiferty는 MIT 라이선스를 사용하므로 매우 자유롭게 사용할 수 있습니다.

유용해 보인다면 직접 사용해 보시기 바랍니다.

[![](./cover.png)](https://github.com/mackysoft/Modiferty)

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)
