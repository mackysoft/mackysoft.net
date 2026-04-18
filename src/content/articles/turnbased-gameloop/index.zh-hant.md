---
title: "如何實作回合制的遊戲迴圈【C#】"
description: "本文介紹用來實作回合制遊戲迴圈的程式碼。我製作的回合制 Roguelike《Treasure Rogue》基本上就是依靠接下來介紹的程式碼運作。為了讓程式碼更容易閱讀，我省略了非絕對必要的部分。"
publishedAt: "2020-06-14T22:33:35+09:00"
updatedAt: "2020-06-14T22:34:54+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
---

## 前言

本文會介紹用來實作回合制遊戲迴圈的程式碼。

我製作的回合制 Roguelike [《Treasure Rogue》](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue) 基本上就是依靠接下來介紹的程式碼運作的。（為了讓程式碼更容易閱讀，我省略了非絕對必要的部分）

## Commander

Commander 元件會掛在「依照回合制規則行動的物件」上。

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

呼叫 `BeginTurn` 時，Commander 就會開始自己的回合。由於 `OnBeginTurn` 事件會被觸發，請把回合開始時要執行的處理註冊到 `OnBeginTurn`。

回合開始後，務必要呼叫 `EndTurn`。

接著來看負責管理 Commander 的 `TurnManager` 程式碼。

## TurnManager

`TurnManager` 是負責管理回合制迴圈的類別。

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

因為有 `AddCommander` 函式，所以只要把想納入回合制迴圈的 Commander 加進來即可。（Commander 會在 `OnEnable` 時自動呼叫 `AddCommander`）

## 結語

雖然這仍然是非常精簡的配置，但只要把 Commander 與 TurnManager 分開，就已經足以作為回合制的基礎。

之後再依照遊戲需求補上「決定行動順序」「無法戰鬥時跳過」「結束行動的條件」等規則，就能直接發展成實用的迴圈系統。
