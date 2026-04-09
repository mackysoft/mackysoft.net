---
title: "【Unity】シングルトンなScriptableObjectを実装する"
description: "はじめに 「○○Settings」のようなものを実装するときに使えるSingletonScriptableObjectの紹介です。 コード using UnityEngine; public abstract class … 【Unity】シングルトンなScriptableObjectを実装する"
publishedAt: "2020-06-13T21:19:19+09:00"
updatedAt: "2020-06-13T21:19:20+09:00"
draft: true
tags:
  - "unity"
---

## はじめに

「○○Settings」のようなものを実装するときに使えるSingletonScriptableObjectの紹介です。

## コード

```cs

using UnityEngine;

public abstract class SingletonScriptableObject : ScriptableObject where T : SingletonScriptableObject {

	static T m_Instance;

	public static T Instance {
		get {
			if (m_Instance == null) {
				m_Instance = Resources.Load(typeof(T).Name);
			}
			return m_Instance;
		}
	}

}
```

クラス名と同じアセットをResourcesからロードします。

```cs

using UnityEngine;

[CreateAssetMenu(fileName = nameof(ExampleSettings))]
public class ExampleSettings : SingletonScriptableObject {

}
```
