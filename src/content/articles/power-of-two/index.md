---
title: "【Unity】2の累乗の便利関数＆使用例【Mathf】"
description: "2の累乗の関数 bool IsPowerOfTwo (int value) valueが2の累乗かどうかを返します。 // false Debug.Log(Mathf.IsPowerOfTwo(7)); // true … 【Unity】2の累乗の便利関数＆使用例【Mathf】"
publishedAt: "2020-06-01T19:47:09+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "unity"
---

## 2の累乗の関数

### bool IsPowerOfTwo (int value)

valueが2の累乗かどうかを返します。

```cs

// false
Debug.Log(Mathf.IsPowerOfTwo(7));

// true
Debug.Log(Mathf.IsPowerOfTwo(32));
```

### int ClosestPowerOfTwo (int value)

valueに最も近い2の累乗の値を返します。

```cs

// 8
Debug.Log(Mathf.ClosestPowerOfTwo(7));

// 16
Debug.Log(Mathf.ClosestPowerOfTwo(19));
```

### int NextPowerOfTwo (int value)

value以上の最も近い2の累乗の値を返します。

```cs

// 8
Debug.Log(Mathf.NextPowerOfTwo(7));

// 256
Debug.Log(Mathf.NextPowerOfTwo(139));

// 256
Debug.Log(Mathf.NextPowerOfTwo(256));
```

2の累乗の長さの配列を作成したりするときに使えます。

## 使用例

僕の場合は、**「高い頻度で長さが変わる配列の生成頻度を抑える」**という目的で2の累乗を使用しました。

以下のコードは、実際に2の累乗を使用したコードの一例です。

```cs

const int k_BoundingSpheresMinLength = 16;

BoundingSphere[] m_BoundingSpheres = Array.Empty<BoundingSphere>();
readonly List<CullingTarget> m_Targets = new List<CullingTarget>();

// Targetsの数以上かつ、2の累乗の配列を作成する。
void UpdateBoundingSpheres () {
	// Targetsの数以上の最も近い2の累乗の値を取得
	int nextPowerOfTwo = Mathf.NextPowerOfTwo(m_Targets.Count);
	int length = Mathf.Max(nextPowerOfTwo,k_BoundingSpheresMinLength);

	if (length != m_BoundingSpheres.Length) {
		m_BoundingSpheres = new BoundingSphere[length];
	}
}
```

## 参考

-   [Scripting API: Mathf](https://docs.unity3d.com/ScriptReference/Mathf.html)
