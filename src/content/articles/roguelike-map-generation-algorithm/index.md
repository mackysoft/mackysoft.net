---
title: "ローグライクのマップ生成アルゴリズムについて解説"
description: "はじめに 『TreasureRogue』というローグライクゲームを作ったので、その際に実装したマップ生成アルゴリズムについて解説します。 『TreasureRogue』は縦長のマップを生成しますが、基本的な実装は「不思議 … ローグライクのマップ生成アルゴリズムについて解説"
publishedAt: "2020-06-02T20:19:41+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "treasure-rogue"
  - "unity"
cover: "./cover.png"
coverAlt: "ローグライクのマップ生成アルゴリズムについて解説 の記事画像"
---

## はじめに

[『TreasureRogue』](/games/treasure-rogue/)というローグライクゲームを作ったので、その際に実装したマップ生成アルゴリズムについて解説します。

『TreasureRogue』は縦長のマップを生成しますが、基本的な実装は「不思議のダンジョン」系のマップ生成にも使えると思います。

## マップ生成の基本的な実装

具体的な実装を見る前にまず、大まかにどういった処理を行っているかを確認しておきましょう。

### ILevelProcessor

ILevelProcessorインターフェースは「マップにオブジェクトを生成する」など、マップ生成時の処理をするクラスに実装します。

```cs

public interface ILevelProcessor {

	// fieldに何かしらの非同期処理を行う
	IEnumerator Process (IField field);

}
```

ILevelProcessorの具体的な実装については、後ほど解説します。

### マップを生成する処理

ILevelProcessorのコレクションをループで回し、Process関数を順番に呼ぶことで、オブジェクト生成などの処理を行います。

```cs

public class Field : IField {

	// 省略

	// マップ生成を行う関数
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

## マップ生成の具体的な実装

どういう処理をしているかをザックリと把握したところで、具体的にどういう実装をしているかを解説していきます。

### １．マップの土台を生成

まずマップの土台を生成します。

![](./ClearField.jpg)

### ２．経路を確保する

ランダムでオブジェクトを配置していると、プレイヤーが通ることのできないマップが生成される可能性があるので、まずは**「オブジェクトを生成できない位置」**を決めておきます。

![](./SecurePathProcessor-2.jpg)

#### 実際のコード

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

SecurePathProcessorはILevelProcessorを実装しています。つまり、マップ生成時のループでProcess関数が呼ばれることになります。

SecurePath関数では「fieldに登録されているプレイヤー」から「指定した位置」までランダムな経路を生成し、その経路にはオブジェクトが生成されないようになります。

### ３．アクセス可能なオブジェクトを生成

あとは「アクセス可能なオブジェクト（敵や宝箱）」と「障害物」を生成するだけなのですが、まずはアクセス可能なオブジェクトから生成します。

障害物が生成される前に、「アクセス可能なオブジェクト」への経路を確保する必要があるからです。

![](./GenerateAccessableObject.jpg)

#### 実際のコード

```cs

[Serializable]
public class MultiSpawnLevelBuilder : ILevelProcessor {

	// オブジェクト生成数が多いと、経路の確保処理（経路探索）が重すぎてフリーズする。
	// なので生成数が10を超えるときは経路の確保を行わない。
	const int k_SecurePathAcceptableQuantity = 10;

	[SerializeField]
	FieldObject m_Prefab;

	[SerializeField]
	FieldObjectQuantitiy m_Quantity = new FieldObjectQuantitiy(1);

	[SerializeField]
	bool m_SecurePath;

	public IEnumerator Process (IField field) {
		// オブジェクトを生成して、オブジェクトへの経路を確保する処理
		// 長いので省略
	}
}
```

MultiSpawnLevelBuilderも同じく、ILevelProcessorを実装しています。

### ４．障害物を生成

最後に障害物を生成します。確保した経路には障害物は生成されません。

![](./GenerateObstacle-1.jpg)

コードは「アクセス可能なオブジェクトを生成」と同じものを使用しています。ただし、経路の確保処理は行いません。（障害物なので）

* * *

以上でマップ生成の解説は終わりです。

## おわりに
