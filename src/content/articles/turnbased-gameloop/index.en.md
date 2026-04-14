---
title: "How to Implement a Turn-Based Game Loop [C#]"
description: "This article introduces the code used to implement a turn-based game loop. Treasure Rogue, the turn-based roguelike I made, basically runs on the code shown here. I leave out anything that is not strictly necessary so the code is easier to read."
publishedAt: "2020-06-14T22:33:35+09:00"
updatedAt: "2020-06-14T22:34:54+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
---

## Introduction

This article introduces the code used to implement a turn-based game loop.

My turn-based roguelike, [Treasure Rogue](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue), basically runs on the code introduced here. (I leave out anything that is not absolutely necessary so the code is easier to read.)

## Commander

The Commander component is attached to objects that "behave according to the rules of the turn-based system."

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

When `BeginTurn` is called, the Commander starts its turn. The `OnBeginTurn` event is fired, so register any work that should happen when a turn starts there.

After a turn begins, always call `EndTurn`.

Next is the code for `TurnManager`, which manages Commanders.

## TurnManager

`TurnManager` manages the turn-based loop.

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

`AddCommander` lets you add any Commander you want to bring into the turn-based loop. (Commanders call `AddCommander` automatically from `OnEnable`.)
