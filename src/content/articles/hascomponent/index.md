---
title: "【Unity】HasComponent関数【拡張メソッド】"
description: "Unityで「単純にコンポーネントを持っているかチェックしたいな」みたいなことがあって、ただ「GetComponentしてnullチェック」とか「TryGetComponentするけど結果は破棄」はなんか嫌という潔癖なと … 【Unity】HasComponent関数【拡張メソッド】"
publishedAt: "2020-06-04T19:33:53+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
draft: true
tags:
  - "unity"
---

Unityで**「単純にコンポーネントを持っているかチェックしたいな」**みたいなことがあって、ただ「GetComponentしてnullチェック」とか「TryGetComponentするけど結果は破棄」はなんか嫌という潔癖なところがあるので、HasCompoent関数を実装しました。

```cs

using UnityEngine;

public static class GameObjectExtensions {

	public static bool HasComponent<T> (this GameObject gameObject) {
		return gameObject.TryGetComponent(out T _);
	}

	public static bool HasComponent<T> (this Component component) {
		return component.TryGetComponent(out T _);
	}

}
```

HasCompoentという名前がとても分かりやすくて気に入っています。

```cs

// Moverコンポーネントを持っているかチェックする
if (gameObject.HasComponent<Mover>()) {
	// 何かする
}
```
