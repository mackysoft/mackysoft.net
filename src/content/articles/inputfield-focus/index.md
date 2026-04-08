---
title: "【Unity】InputFieldをフォーカスする【uGUI, TextMesh Pro】"
description: "「InputFieldをスクリプトから自動でフォーカスしたい！」という時がある。 そんな時はInputField.Select関数を呼ぼう。 using UnityEngine; using UnityEngine.UI … 【Unity】InputFieldをフォーカスする【uGUI, TextMesh Pro】"
publishedAt: "2020-05-28T20:19:48+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "textmesh-pro"
  - "ugui"
  - "ui"
  - "unity"
cover: "./cover.png"
coverAlt: "【Unity】InputFieldをフォーカスする【uGUI, TextMesh Pro】 の記事画像"
---

「InputFieldをスクリプトから自動でフォーカスしたい！」という時がある。

そんな時は**InputField.Select関数**を呼ぼう。

```cs

using UnityEngine;
using UnityEngine.UI;

public class PlayerNameInputUI : MonoBehaviour {

	public InputField nameInputField;

	void Start () {
		// InputFieldを自動でフォーカスする
		nameInputField.Select();
	}
}
```

InputField（およびTMP\_InputField）は**UnityEngine.UI.Selectableを継承している**ので、ButtonやToggleと同じように振舞える。覚えておこう。
