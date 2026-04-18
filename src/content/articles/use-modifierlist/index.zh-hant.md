---
title: "【Unity】用 ModifierList 實作防禦強化【Modiferty】"
description: "Modiferty 是一套狀態管理函式庫。如果你還不了解 Modiferty 的概要，先閱讀下方文章會更容易理解。"
publishedAt: "2020-05-24T00:42:00+09:00"
updatedAt: "2020-05-24T15:10:23+09:00"
tags:
  - "modiferty"
  - "unity"
cover: "./cover.png"
coverAlt: "【Unity】用 ModifierList 實作防禦強化【Modiferty】 的文章圖片"
---

## 前言

Modiferty 是一套狀態管理函式庫。

如果你還不了解 Modiferty 的概要，先閱讀下方文章會更容易理解。

[【Unity】使用 Modiferty 管理遊戲狀態](/articles/modiferty-introduction/)

## 什麼是 ModifierList？

`ModifiableProperty` 用於變動個別狀態值，

而 `ModifierList` 則可以 **變動傳入給它的值**。

例如，它可以讓你在套用傷害之前，先對傷害數值做前處理。（以寶可夢來說像是「鐵壁」，以勇者鬥惡龍來說則類似「斯卡拉」）

## 具體實作範例

接下來就實際來實作 **「降低受到傷害的處理」**。

### 1. 宣告 ModifierList

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// Character health
	public int health = 3;

	// ModifierList that preprocesses incoming damage
	public ModifierList<int> damageModifiers = new ModifierList<int>();

}
```

如果體力的型別不是 `int` 而是 `float`，就使用 `ModifierList<float>`。

這樣一來，就完成了降低受到傷害的準備。

### 2. 在 ModifierList 中加入 Modifier

接著來實作能提升角色防禦力的道具。

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class DefenseUpItem : MonoBehaviour {

	// Amount to subtract
	public SubstractiveModifierInt substractDamageModifier = new SubstractiveModifierInt(amount: 1);

	void OnCollisionEnter (Collision collision) {
		Character target = collision.collider.GetComponentInParent<Character>();
		if (target != null) {
			// Add a Modifier that subtracts from the value to target.damageModifiers
			target.damageModifiers.Add(substractDamageModifier);
		}
	}
}
```

當角色碰到這個 DefenseUpItem 時，`SubstractiveModifierInt`（會減少數值的 Modifier）就會被加入該角色的 `damageModifiers`。

換句話說，就能降低那個角色受到的傷害。

這次使用的是 `SubstractiveModifierInt`，但如果你想實作像「讓傷害變成 0.9 倍」這樣的效果，也可以改用 `MultiplyModifier` 等其他 Modifier。

### 3. 受到攻擊的處理

接著來實作角色受到傷害時的處理。

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// Character health
	public int health = 3;

	// ModifierList that preprocesses incoming damage
	public ModifierList<int> damageModifiers = new ModifierList<int>();

	public int attackPower = 2;

	// Damage-taking process
	public void TakeDamage (Character attacker) {

		// Apply damageModifiers to the incoming damage
		health -= damageModifiers.Evaluate(attacker.attackPower);

	}

}
```

重點在於 **`damageModifiers.Evaluate(attacker.attackPower)`**。

`ModifierList` 的 `Evaluate` 函式會對 `attacker.attackPower` 套用變更。

如果受到傷害的角色正好帶有 DefenseUpItem 的效果，

**「2（攻擊方角色的攻擊力）- 1（SubstractiveModifierInt 的減算量）」**

那麼實際受到的傷害就會變成 `1`。

### 4. 從 ModifierList 移除 Modifier

不論是「鐵壁」還是「斯卡拉」，都不能讓角色永久維持強化狀態。要解除效果時，就把 Modifier 從 `ModifierList` 中移除。

它基本上可以像 `List<T>` 一樣使用，另外也提供了方便的輔助函式。

```cs

// Remove a specific Modifier
damageModifiers.Remove(someModifier);

// Remove all Modifiers.
damageModifiers.Clear();

// Remove all Modifiers whose type matches.
// In this case, remove all SubstractiveModifierInt instances.
damageModifiers.RemoveAll<SubstractiveModifierInt>();

// Remove all Modifiers that match the condition.
// In this case, remove all SubstractiveModifierInt instances whose Amount is 3 or more.
damageModifiers.RemoveAll(modifier => {
	return (modifier is SubstractiveModifierInt result) && (result.Amount >= 3);
});

```

這樣就完成了 **「降低受到傷害的處理」** 的實作。

## 結語

Modiferty 採用 MIT 授權，因此可以非常自由地使用。

如果你覺得它很有幫助，不妨親自試試看。

[![](./cover.png)](https://github.com/mackysoft/Modiferty)

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)
