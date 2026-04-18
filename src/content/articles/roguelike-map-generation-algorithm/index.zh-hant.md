---
title: "解說 Roguelike 的地圖生成演算法"
description: "我製作了一款名為 Treasure Rogue 的 Roguelike 遊戲，因此本文將解說當時實作的地圖生成演算法。Treasure Rogue 會生成縱向較長的地圖，但其基本實作應該也能用在《不可思議的迷宮》風格的地圖生成上。"
publishedAt: "2020-06-02T20:19:41+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "treasure-rogue"
  - "unity"
cover: "./cover.png"
coverAlt: "解說 Roguelike 的地圖生成演算法 的文章圖片"
---

## 前言

[《Treasure Rogue》](/games/treasure-rogue/) 是我製作的一款 Roguelike 遊戲，這篇文章會解說我在其中實作的地圖生成演算法。

Treasure Rogue 會生成縱向較長的地圖，但其基本實作應該也能用在《不可思議的迷宮》風格的地圖生成上。

## 地圖生成的基本實作

在查看具體實作之前，先來確認整體大致會做哪些處理。

### ILevelProcessor

`ILevelProcessor` 介面會由在地圖生成期間執行處理的類別實作，例如在地圖上生成物件。

```cs

public interface ILevelProcessor {

	// Perform some asynchronous processing on the field
	IEnumerator Process (IField field);

}
```

之後會再說明 `ILevelProcessor` 的具體實作。

### 生成地圖的處理

透過迴圈巡覽 `ILevelProcessor` 的集合，依序呼叫 `Process`，就能執行生成物件等處理。

```cs

public class Field : IField {

	// omitted

	// Function that generates the map
	IEnumerator GenerateInternal () {
		m_IsGenerating.Value = true;

		yield return GenerateField();

		foreach (ILevelProcessor processor in Processors) {
			yield return processor.Process(this);
		}

		m_IsGenerating.Value = false;
	}
}
```

## 地圖生成的具體實作

既然已經大致掌握這套流程會做什麼，接下來就來看看實際上是如何實作的。

### 1. 生成地圖基底

首先，先生成地圖的基底。

![](./ClearField.jpg)

### 2. 確保路徑

如果隨機配置物件，就有可能生成玩家無法通行的地圖，因此要先決定 **「不能生成物件的位置」**。

![](./SecurePathProcessor-2.jpg)

#### 實際程式碼

```cs

[SerializeField]
public class SecurePathProcessor : ILevelProcessor {

	public static SecurePathProcessor Instance { get; } = new SecurePathProcessor();

	public IEnumerator Process (IField field) {
		yield return FieldManager.Instance.GraphUpdate();
		yield return field.SecurePath(to: new Vector3Int(
			Random.Range(0,field.Bounds.size.x),
			0,
			field.Bounds.zMax
		));
	}
}
```

`SecurePathProcessor` 會實作 `ILevelProcessor`。也就是說，在地圖生成時的迴圈中會呼叫 `Process`。

`SecurePath` 會從註冊在 field 中的玩家位置，隨機生成一條通往指定位置的路徑，並避免在那條路徑上生成物件。

### 3. 生成可到達的物件

接下來只剩下生成「可到達的物件（敵人與寶箱）」以及「障礙物」，不過要先從可到達的物件開始生成。

因為必須在生成障礙物之前，先確保通往這些可到達物件的路徑。

![](./GenerateAccessableObject.jpg)

#### 實際程式碼

```cs

[Serializable]
public class MultiSpawnLevelBuilder : ILevelProcessor {

	// If too many objects are spawned, the path-securing process (pathfinding) becomes too heavy and freezes the game.
	// So when the number of generated objects exceeds 10, the system does not secure paths.
	const int k_SecurePathAcceptableQuantity = 10;

	[SerializeField]
	FieldObject m_Prefab;

	[SerializeField]
	FieldObjectQuantitiy m_Quantity = new FieldObjectQuantitiy(1);

	[SerializeField]
	bool m_SecurePath;

	public IEnumerator Process (IField field) {
		// The object spawning and path-securing process
		// is long, so it is omitted here.
	}
}
```

`MultiSpawnLevelBuilder` 同樣也實作了 `ILevelProcessor`。

### 4. 生成障礙物

最後生成障礙物。在已確保的路徑上不會生成障礙物。

![](./GenerateObstacle-1.jpg)

程式碼與「生成可到達的物件」使用的是同一套。不過因為這裡生成的是障礙物，所以不會執行確保路徑的處理。

## 結語

以上就是《Treasure Rogue》中使用的地圖生成演算法的基本流程。

只要依照想生成的物件與遊戲規則替換各個 `ILevelProcessor`，就能在維持相同架構的前提下，套用到各種不同的地圖生成需求。
