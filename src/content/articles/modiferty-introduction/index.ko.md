---
title: "[Unity] Modiferty로 게임 능력치 관리하기 [Modiferty]"
description: "게임을 만들면서 Modiferty라는 라이브러리를 만들었고, 이를 GitHub에 공개했습니다. 캐릭터와 무기에 능력치 개념이 있는 게임 전반에서 폭넓게 활용할 수 있습니다."
publishedAt: "2020-05-21T01:23:04+09:00"
updatedAt: "2020-05-27T13:58:20+09:00"
tags:
  - "asset"
  - "modiferty"
  - "unity"
cover: "./cover.png"
coverAlt: "[Unity] Modiferty로 게임 능력치 관리하기 [Modiferty]의 글 이미지"
---

## 소개

게임을 만들다가 꽤 쓸 만한 라이브러리가 나와서, **[Modiferty](https://github.com/mackysoft/Modiferty)** 를 GitHub에 공개했습니다!

이 라이브러리는 캐릭터와 무기에 능력치 개념이 있는 게임에서 폭넓게 활용할 수 있습니다.

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)

## Modiferty란?

Modiferty는 게임 속 캐릭터와 무기의 능력치 변화를 다루는 데 강합니다.

-   값이 2배가 되었는지, 1만큼 증가했는지 같은 변경 내용을 확인할 수 있습니다.
-   여러 단계에 걸친 능력치 변화를 관리할 수 있습니다.

이것만으로는 실제로 어떤 느낌인지 감이 잘 오지 않을 수 있으니, 구체적인 예로 설명하겠습니다.

## 능력치 상승 구현

게임에서 캐릭터의 능력치를 일시적으로 올리는 기능을 구현하고 싶을 때는 어떻게 할까요? (포켓몬의 칼춤이나 드래곤 퀘스트의 능력치 강화 기술 같은 것이라고 생각하면 됩니다.)

제가 떠올릴 수 있는 방법은 크게 두 가지입니다.

1.  능력치 값을 직접 덮어쓴다
2.  "공격력 배율" 같은 변수를 준비한 뒤 공격할 때 배율을 적용한다

### 1. 능력치 값을 직접 덮어쓰기

```cs

using UnityEngine;

public class Character : MonoBehaviour {

	public int health = 3;
	public int attackPower = 2;

	// 공격 처리
	public void Attack (Character target) {
		// 현재 공격력과 같은 만큼의 피해를 준다
		target.health -= attackPower;
	}

	// 공격력 상승
	public void PowerUp (int additionalAttackPower) {
		attackPower += additionalAttackPower;
	}
}
```

이 방법은 단순하지만, 단점도 많습니다.

-   어떤 능력치 변화가 일어났는지 알 수 없으므로, "초기값에서 1 증가" 같은 연출을 만들기 어렵습니다.
-   "가산과 곱셈이 섞인 변화"나 다른 복잡한 수정을 관리하기가 어려워집니다.

### 2. "공격력 배율" 변수를 준비한 뒤 공격할 때 적용하기

```cs

using UnityEngine;
using System.Collections.Generic;

public class Character : MonoBehaviour {

	public int health = 3;
	public int attackPower = 2;

	// 배율 목록
	public List<float> attackPowerMultiply = new List<float>();

	// 공격 처리
	public void Attack (Character target) {
		int multipliedAttackPower = attackPower;

		// 공격력에 배율을 적용한다
		foreach (float multiply in attackPowerMultiply) {
			multipliedAttackPower *= multiply;
		}

		// 수정된 공격력에 따라 피해를 준다
		target.health -= multipliedAttackPower;
	}
}
```

이 방법을 쓰면 어떤 능력치 변화가 발생하는지는 확인할 수 있으므로, 그에 맞는 연출을 만들 수 있습니다.

하지만 배율만 지원하므로 확장성은 높지 않습니다.

Modiferty는 위 문제를 해결하는 라이브러리입니다.

-   값이 2배가 되었는지, 1만큼 증가했는지 같은 변경 내용을 확인할 수 있습니다.
-   여러 단계에 걸친 능력치 변화를 관리할 수 있습니다.

## 구체적인 구현 예시

여기서는 공격력이 변하는 캐릭터를 예로 들어 설명하겠습니다.

### 1. ModifiableProperty로 attackPower 선언하기

먼저 캐릭터의 공격력처럼 "변경 가능한 값"은 int나 float 대신 **ModifiableProperty**로 선언합니다.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// baseValue는 변형의 시작점이 되는 기준값
	public ModifiableInt attackPower = new ModifiableInt(baseValue: 2);

}
```

이번에는 int 대신 ModifiableInt를 사용했습니다. (float가 필요하다면 ModifiableFloat를 사용하면 됩니다.)

이제 캐릭터의 공격력 변화를 관리할 수 있습니다.

### 2. Modifier 추가하기

다음으로, 닿은 캐릭터의 공격력을 올려 주는 아이템을 만들어 보겠습니다.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class PowerUpItem : MonoBehaviour {

	// 더할 양
	public AdditiveModifierInt additiveAttackPower = new AdditiveModifierInt(amount: 1);

	void OnCollisionEnter (Collision collision) {
		Character target = collision.collider.GetComponentInParent<Character>();
		if (target != null) {
			// attackPower.Modifiers에 값을 1 올려 주는 Modifier를 추가한다
			target.attackPower.Modifiers.Add(additiveAttackPower);
		}
	}
}
```

여기서 "AdditiveModifierInt가 정확히 무엇이지?" 하고 생각할 수 있습니다.

간단히 말하면, AdditiveModifierInt는 Modiferty에서 중요한 개념인 **Modifier** 중 하나입니다.

이 예시에서는 Modifier인 additiveAttackPower가 접촉한 캐릭터의 attackPower.Modifiers에 추가되는 것을 볼 수 있습니다. (삭제도 가능합니다.)

이 Modifier는 앞서 소개한 배율 목록과 비슷한 역할을 합니다.

이 예시에서는 AdditiveModifier(가산)를 사용했지만, Modiferty에는 사칙연산 전반을 다루는 Modifier와 특수한 변형을 위한 Modifier도 포함되어 있습니다. ([Modiferty - Modifier Types](https://github.com/mackysoft/Modiferty#modifier-types))

즉, Modiferty는 **값에 대해 복잡한 조합 처리를 수행하고 그 결과를 관리할 수 있게 해 주는 라이브러리**라고 할 수 있습니다.

### 3. attackPower에 Modifier 적용하기

다음으로 캐릭터의 공격 동작을 작성합니다.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	public int health = 3;

	// baseValue는 변형의 시작점이 되는 기준값
	public ModifiableInt attackPower = new ModifiableInt(baseValue: 2);

	public void Attack (Character target) {
		target.health -= attackPower.Evaluate();
	}

}
```

중요한 부분은 **attackPower.Evaluate()** 입니다.

Evaluate 함수는 ModifiableInt(및 ModifiableProperty)에 구현되어 있으며, **해당 속성에 연결된 모든 Modifier를 baseValue에 적용**합니다.

앞서 나온 "배율 목록을 적용하는 처리"를 떠올리면 이해하기 쉬울 것입니다.

예를 들어 다음과 같은 상태라면:

-   attackPower의 기준값이 2
-   attackPower에 값이 1인 AdditiveModifier가 추가됨

이때 attackPower.Evaluate()를 실행하면,

**2 (baseValue) + 1 (AdditiveModifier)** 이므로 반환값은 3이 됩니다.

이렇게 해서 Modiferty 구현이 완성됩니다.

## 마무리

이 라이브러리는 MIT 라이선스이므로 매우 자유롭게 사용할 수 있습니다.

저도 실제 게임에서 사용하고 있는데, 기본적으로는 아래 두 가지만 익히면 되어서 도입하기 쉽습니다.

-   ModifiableProperty로 값을 선언한다
-   그 값을 변경할 때 Modifier를 사용한다

유용해 보인다면 한 번 사용해 보시기 바랍니다.

[![](./cover.png)](https://github.com/mackysoft/Modiferty)

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)
