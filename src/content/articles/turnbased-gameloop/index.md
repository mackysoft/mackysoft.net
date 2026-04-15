---
title: "ターン制のゲームループを実装する方法【C#】"
description: "はじめに この記事ではターン制のゲームループを実装するためのコードを紹介します。 僕が作ったターン制のローグライクゲームである『Treasure Rogue』は、基本的にこれから紹介するコードで動いています。（コードを見 … ターン制のゲームループを実装する方法【C#】"
publishedAt: "2020-06-14T22:33:35+09:00"
updatedAt: "2020-06-14T22:34:54+09:00"
tags:
  - "csharp"
  - "treasure-rogue"
---

## はじめに

この記事ではターン制のゲームループを実装するためのコードを紹介します。

僕が作ったターン制のローグライクゲームである[『Treasure Rogue』](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue)は、基本的にこれから紹介するコードで動いています。（コードを見やすくするため、絶対的に必要でない箇所は省略しています）

## Commander

Commanderコンポーネントは「ターン制のルールに従って振舞うオブジェクト」にアタッチします。

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

	// ターンを開始する関数の最低限のコード。
	// ゲームによっては「HPが0ならスキップ」みたいな処理を入れる。
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

BeginTurn関数が呼ばれると、Commanderのターンが開始します。OnBeginTurnイベントが発火するので、ターンが始まったときの処理をOnBeginTurnに登録しておいてください。

ターンが始まった後は必ずEndTurn関数を呼びましょう。

続いては、Commanderを管理するTurnManagerのコードです。

## TurnManager

TurnManagerはターン制ループを管理するクラスです。

```cs

using System;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TurnManager : SingletonMonoBehaviour<TurnManager> {

	public bool startLoopOnStart;

	// 登録されたCommander
	readonly List<Commander> m_Commanders = new List<Commander>();

	// 保留中のCommander
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
			// 保留中のCommanderをループに追加する
			if (m_PendingCommanders.Count > 0) {
				foreach (Commander commander in m_PendingCommanders.ToArray()) {
					if (commander) {
						m_Commanders.Add(commander);
					}
				}
				m_PendingCommanders.Clear();
			}

			// ターンを回す
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

	// 登録されたCommanderを優先度順に並び替たシーケンスを返す
	IEnumerable<Commander> OrderedCommanders () {
		return m_Commanders
			.Where(c => c != null)
			.OrderByDescending(c => c.Priority);
	}

	// Commanderを仮登録する
	public bool AddCommander (Commander commander) {
		if (commander == null) {
			throw new ArgumentNullException(nameof(commander));
		}
		return m_PendingCommanders.Add(commander);
	}

	// Commanderをループから削除する
	public bool RemoveCommander (Commander commander) {
		m_Commanders.Remove(commander);
		return m_PendingCommanders.Remove(commander);
	}
}
```

AddCommander関数を持っているので、ターン制のループに取り込みたいCommanderを追加します。（CommanderはOnEnable時に自動でAddCommanderを呼びます）

## おわりに

かなり最小限の構成ですが、CommanderとTurnManagerを分けておくだけでも、ターン制の土台としては十分に使えます。

ゲームに合わせて「行動順の決定」「戦闘不能時のスキップ」「行動終了条件」などを足していけば、そのまま実用的なループに育てられます。
