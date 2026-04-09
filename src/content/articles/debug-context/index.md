---
title: "【Unity】Debug.Logのcontextとは？【覚えておくと便利】"
description: "はじめに GIFの通りですが、この記事ではデバッグの際に便利なDebug.Logのオーバーロードを紹介します。 // いつも使うやつ Debug.Log(string message); // この機能で紹介するDebu … 【Unity】Debug.Logのcontextとは？【覚えておくと便利】"
publishedAt: "2020-05-31T17:35:48+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
draft: true
tags:
  - "unity"
cover: "./cover.gif"
coverAlt: "【Unity】Debug.Logのcontextとは？【覚えておくと便利】 の記事画像"
---

## はじめに

GIFの通りですが、この記事ではデバッグの際に便利なDebug.Logのオーバーロードを紹介します。

```cs

// いつも使うやつ
Debug.Log(string message);

// この機能で紹介するDebug.Logのオーバーロード
Debug.Log(string message,Object context);
```

## 使ってみる

以下のコードは、contextを指定するDebug.Logのオーバーロードを使用してログを出力する例です。

```cs

using UnityEngine;

public class DebugExample : MonoBehaviour {

	void Start () {
		Debug.Log("Push me",this);
	}
}
```

コンソールに出力する文字列に加えて、UnityEngine.Object型のオブジェクトを指定します。主にゲームオブジェクトやコンポーネントを指定します。

これだけで、コンソールでログをクリックした際、context引数に指定したオブジェクトをフォーカスできるようになります。

この例だと、「DebugExampleコンポーネントがアタッチされているゲームオブジェクト」がフォーカスされます。

## おわりに

Logだけでなく、LogWarningやLogErrorなどでも同じことができます。

デバッグの際に便利なので、覚えておくと良いですね。
