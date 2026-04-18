---
title: "턴제 게임 루프를 구현하는 방법 [C#]"
description: "이 글에서는 턴제 게임 루프를 구현하는 데 사용하는 코드를 소개합니다. 제가 만든 턴제 로그라이크 Treasure Rogue도 기본적으로는 여기 소개하는 코드로 동작합니다. 읽기 쉽게 하기 위해 꼭 필요한 부분만 남기고 나머지는 생략했습니다."
publishedAt: "2020-06-14T22:33:35+09:00"
updatedAt: "2020-06-14T22:34:54+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
---

## 서론

이 글에서는 턴제 게임 루프를 구현하는 데 사용하는 코드를 소개합니다.

제가 만든 턴제 로그라이크 [Treasure Rogue](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue)도 기본적으로는 여기 소개하는 코드로 동작합니다. (읽기 쉽게 하기 위해 꼭 필요한 부분만 남기고 나머지는 생략했습니다.)

## Commander

Commander 컴포넌트는 “턴제 시스템의 규칙에 따라 동작하는” 오브젝트에 붙입니다.

```cs

using System;
using UnityEngine;

public class Commander : MonoBehaviour {

	[SerializeField]
	int m_Priority;

	public int Priority { get => m_Priority; set => m_Priority = value; }

	public bool IsTurn { get; private set; }

	public event Action<Commander> OnBeginTurn;

	void OnEnable () {
		TurnManager.Instance.AddCommander(this);
	}

	void OnDisable () {
		TurnManager.Instance.RemoveCommander(this);
	}

	// Minimal code for a function that starts a turn.
	// Depending on the game, you might add logic such as "skip if HP is 0."
	public bool BeginTurn () {
		if (IsTurn) {
			return false;
		}
		IsTurn = true;

		OnBeginTurn?.Invoke(this);

		return true;
	}

	public void EndTurn () {
		IsTurn = false;
	}

}
```

`BeginTurn`을 호출하면 Commander가 자신의 턴을 시작합니다. `OnBeginTurn` 이벤트가 발생하므로, 턴이 시작될 때 실행할 작업은 여기에 등록하면 됩니다.

턴이 시작된 뒤에는 반드시 `EndTurn`을 호출해야 합니다.

다음은 Commander를 관리하는 `TurnManager` 코드입니다.

## TurnManager

`TurnManager`는 턴제 루프를 관리합니다.

```cs

using System;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TurnManager : SingletonMonoBehaviour<TurnManager> {

	public bool startLoopOnStart;

	// Registered Commanders
	readonly List<Commander> m_Commanders = new List<Commander>();

	// Pending Commanders
	readonly HashSet<Commander> m_PendingCommanders = new HashSet<Commander>();

	void Start () {
		if (startLoopOnStart) {
			StartLoop();
		}
	}

	public void StartLoop () {
		StartCoroutine(Loop());
	}

	IEnumerator Loop () {
		while (true) {
			// Add pending Commanders to the loop
			if (m_PendingCommanders.Count > 0) {
				foreach (Commander commander in m_PendingCommanders.ToArray()) {
					if (commander) {
						m_Commanders.Add(commander);
					}
				}
				m_PendingCommanders.Clear();
			}

			// Advance turns
			foreach (Commander commander in OrderedCommanders().ToArray()) {
				if (commander == null) {
					m_Commanders.Remove(commander);
					continue;
				}

				if (commander.BeginTurn()) {
					while ((commander != null) && commander.IsTurn.Value) {
						yield return null;
					}
				}
			}
			yield return null;
		}
	}

	// Return the registered Commanders sorted by priority
	IEnumerable<Commander> OrderedCommanders () {
		return m_Commanders
			.Where(c => c != null)
			.OrderByDescending(c => c.Priority);
	}

	// Temporarily register a Commander
	public bool AddCommander (Commander commander) {
		if (commander == null) {
			throw new ArgumentNullException(nameof(commander));
		}
		return m_PendingCommanders.Add(commander);
	}

	// Remove a Commander from the loop
	public bool RemoveCommander (Commander commander) {
		m_Commanders.Remove(commander);
		return m_PendingCommanders.Remove(commander);
	}
}
```

`AddCommander` 함수를 사용하면 턴제 루프에 넣고 싶은 Commander를 추가할 수 있습니다. (Commander는 `OnEnable`에서 자동으로 `AddCommander`를 호출합니다.)

## 맺음말

아직은 매우 최소한의 구성입니다. 하지만 Commander와 TurnManager를 분리하는 것만으로도 턴제 게임 루프의 단단한 기반을 만들 수 있습니다.

그다음에는 턴 순서, 기절 처리, 각 턴을 끝내는 명시적 조건 같은 규칙을 더해 가며 실용적인 시스템으로 확장할 수 있습니다.
