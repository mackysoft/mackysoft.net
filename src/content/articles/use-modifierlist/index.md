---
title: "【Unity】ModifierListでスカラを実装してみる【Modiferty】"
description: "はじめに 「Modiferty」はステータス管理ライブラリです。 「Modifertyの概要について知らない」という人は、まず以下の記事を見てもらえると分かりやすいです。 ゲームのステータス管理にModifertyを使う … 【Unity】ModifierListでスカラを実装してみる【Modiferty】"
publishedAt: "2020-05-24T00:42:00+09:00"
updatedAt: "2020-05-24T15:10:23+09:00"
tags:
  - "modiferty"
  - "unity"
cover: "./cover.png"
coverAlt: "【Unity】ModifierListでスカラを実装してみる【Modiferty】 の記事画像"
---

## はじめに

「Modiferty」はステータス管理ライブラリです。

「Modifertyの概要について知らない」という人は、まず以下の記事を見てもらえると分かりやすいです。

[ゲームのステータス管理にModifertyを使う【Unity】](/articles/modiferty-introduction/)

## ModifierListとは？

ModifiablePropertyが「個別のステータスを変動させる」のに対して、

ModifierListは **「与えられた値を変動させる」** ことができます。

例えば「ダメージを受けるときに、ダメージの値に対して前処理をする」みたいなことができるようになります。（ポケモンで例えると「てっぺき」、ドラクエなら「スカラ」を実装できます）

## 具体的な実装例

では実際に **「受けるダメージを減らす処理」** を実装してみましょう。

### １．ModifierListを宣言してみる

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// キャラクターの体力
	public int health = 3;

	// ダメージに対して前処理を行うModifierList
	public ModifierList<int> damageModifiers = new ModiferList<int>();

}
```

もし体力の型がintではなくfloatなら、ModifierList<float>を使用します。

これで、受けるダメージを減らす準備ができました。

### ２．ModifierListにModifierを追加する

次にキャラクターの防御力を上げるアイテムを実装します。

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class DefenseUpItem : MonoBehaviour {

	// amountは減算量
	public SubstractiveModifierInt substractDamageModifier = new SubstractiveModifierInt(amount: 1);

	void OnCollisionEnter (Collision collision) {
		Character target = collision.collider.GetComponentInParent<Character>();
		if (target != null) {
			// target.damageModifiersに、数値を減算するModifierを追加
			target.damageModifiers.Add(substractDamageModifier);
		}
	}
}
```

このDefenseUpItemにぶつかったキャラクターのdamageModifiersには、SubstractiveModifierInt（値を減算するModifier）が追加されます。

つまり、そのキャラクターが受けるダメージを減算することができます。

今回はSubstractiveModifierIntを使いましたが、「ダメージを0.9倍する」みたいな実装をしたいならMultiplyModifierを使うなどが可能です

### ３．攻撃を受ける処理

キャラクターがダメージを受ける処理を実装します。

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// キャラクターの体力
	public int health = 3;

	// ダメージに対して前処理を行うModifierList
	public ModifierList<int> damageModifiers = new ModiferList<int>();

	public int attackPower = 2;

	// 攻撃を受ける処理
	public void TakeDamage (Character attacker) {

		// 受けるダメージにdamageModifiersを適用する
		health -= damageModifiers.Evaluate(attacker.attackPower);

	}

}
```

大事なのが **damageModifiers.Evaluate(attacker.attackPower)** です。

ModifierListのEvaluate関数が、attacker.attackPowerに対して変更を加えます。

もしダメージを受けるキャラクターがDefenseUpItemの効果を受けていたとすると、

**「２（攻撃側キャラクターの攻撃力）ー１（SubstractiveModifierIntの減算量）」**

受けるダメージは「１」になります。

### ４．ModifierListからModifierを削除

「てっぺき」でも「スカラ」でも、キャラクターを永久に強化しているわけにはいきません。強化を解除する時は、ModifierListからModifierを削除しましょう。

基本的にはList<T>と同じように使用可能で、加えて便利な関数を追加しています。

```cs

// 特定のModifierを削除する
damageModifiers.Remove(someModifier);

// すべてのModifierを削除する。
damageModifiers.Clear();

// 型が一致したすべてのModifierを削除する。
// この場合はSubstractiveModifierIntをすべて削除する。
damageModifiers.RemoveAll<SubstractiveModifierInt>();

// 条件に一致したすべてのModifierを削除する。
// この場合はSubstractiveModifierIntかつ、Amount（減算量）が3以上のModifierをすべて削除する。
damageModifiers.RemoveAll(modifier => {
	return (modifier is SubstractiveModifierInt result) && (result.Amount >= 3);
});

```

これで「受けるダメージを減らす処理」の実装は完了です。

## おわりに

「Modiferty」はMITライセンスなので、かなり自由に使うことができます。

使えそうと思ったら1度試してみてください！

[![](./cover.png)](https://github.com/mackysoft/Modiferty)

Github: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)

