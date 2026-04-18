---
title: "【Unity】使用 Modiferty 管理遊戲的狀態【Modiferty】"
description: "我在製作遊戲時做出了一個相當不錯的函式庫，於是便把名為 Modiferty 的函式庫公開到 GitHub。它廣泛適用於角色與武器具有數值屬性的遊戲。"
publishedAt: "2020-05-21T01:23:04+09:00"
updatedAt: "2020-05-27T13:58:20+09:00"
tags:
  - "asset"
  - "modiferty"
  - "unity"
cover: "./cover.png"
coverAlt: "【Unity】使用 Modiferty 管理遊戲的狀態【Modiferty】的文章圖片"
---

## 前言

我在製作遊戲時做出了一個相當不錯的函式庫，所以便把 **[「Modiferty」](https://github.com/mackysoft/Modiferty)** 這個函式庫公開到了 GitHub！

這個函式庫可以廣泛導入到角色或武器具有「狀態值」概念的遊戲中。

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)

## Modiferty 是什麼？

「Modiferty」很擅長管理遊戲中角色與武器狀態值的變化。

-   可以知道究竟發生了哪一種變更，例如數值是變成 2 倍、增加了 1，等等。
-   可以管理跨越多次的狀態值變更。

光這樣說大概還是會讓人覺得「？」吧，所以我先用具體例子來介紹。

## 實作能力值提升

當你想在遊戲裡實作「角色暫時提升能力值」時，會怎麼做呢？（像是寶可夢的「劍舞」，或《勇者鬥惡龍》的「倍攻」之類的）

我能想到的方法主要有兩種。

1.  直接覆寫狀態值
2.  準備像是「攻擊力倍率」這樣的變數，並在攻擊時套用倍率

### １．直接覆寫狀態值

```cs

using UnityEngine;

public class Character : MonoBehaviour {

	public int health = 3;
	public int attackPower = 2;

	// 攻擊處理
	public void Attack (Character target) {
		// 造成等同於目前攻擊力的傷害
		target.health -= attackPower;
	}

	// 提升攻擊力
	public void PowerUp (int additionalAttackPower) {
		attackPower += additionalAttackPower;
	}
}
```

這個方法很單純，但缺點很多。

-   因為無法得知究竟發生了哪一種狀態變化，所以不能做出像是「從初始值增加了 1」這類演出。
-   一旦出現「加法和乘法混合的變更」或「複雜的變更」，就很難管理。

### ２．準備「攻擊力倍率」變數，並在攻擊時套用倍率

```cs

using UnityEngine;
using System.Collections.Generic;

public class Character : MonoBehaviour {

	public int health = 3;
	public int attackPower = 2;

	// 倍率清單
	public List<float> attackPowerMultiply = new List<float>();

	// 攻擊處理
	public void Attack (Character target) {
		int multipliedAttackPower = attackPower;

		// 將倍率套用到攻擊力上
		foreach (float multiply in attackPowerMultiply) {
			multipliedAttackPower *= multiply;
		}

		// 依照套用倍率後的攻擊力造成傷害
		target.health -= multipliedAttackPower;
	}
}
```

如果用這個方法，就能掌握「會發生哪一種狀態變化」，因此可以基於這點做出相應的演出。

但是這種方法只能處理乘法，所以擴充性很差。

Modiferty 就是能解決上述問題的函式庫。

-   可以知道究竟發生了哪一種變更，例如數值是變成 2 倍、增加了 1，等等。
-   可以管理跨越多次的狀態值變更。

## 具體實作範例

這裡我會介紹一個攻擊力會變動的角色實作範例。

### １．用 ModifiableProperty 宣告 attackPower

首先，把像角色攻擊力這種「想讓它可變動的數值」，從 int 或 float 改用 **ModifiableProperty** 來宣告。

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// baseValue 是數值變動的基礎值
	public ModifiableInt attackPower = new ModifiableInt(baseValue: 2);

}
```

這次我們用 ModifiableInt 來取代 int。（如果是 float，就改用 ModifiableFloat）

如此一來，就能管理角色攻擊力的變化了。

### ２．加入 Modifier

接著，試著做一個「會增加碰撞到之角色攻擊力的道具」。

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class PowerUpItem : MonoBehaviour {

	// 加算量
	public AdditiveModifierInt additiveAttackPower = new AdditiveModifierInt(amount: 1);

	void OnCollisionEnter (Collision collision) {
		Character target = collision.collider.GetComponentInParent<Character>();
		if (target != null) {
			// 在 attackPower.Modifiers 中加入一個讓數值 +1 的 Modifier
			target.attackPower.Modifiers.Add(additiveAttackPower);
		}
	}
}
```

你大概會在這裡想：「AdditiveModifierInt 到底是什麼？」

簡單來說，AdditiveModifierInt 是 Modiferty 中很重要的概念 **「Modifier」** 之一。

在這個例子裡，可以看到身為 Modifier 的 additiveAttackPower 被加入到了碰撞角色的 attackPower.Modifiers 中。（也可以刪除）

這個 Modifier 扮演的角色，就和前面介紹的「倍率」很相似。

這個例子使用的是 AdditiveModifier（加法），不過除了四則運算的 Modifier 以外，也實作了可以做特殊變更的 Modifier。([Modiferty - Modifier Types](https://github.com/mackysoft/Modiferty#modifier-types))

換句話說，Modiferty 可以說是 **「能對數值執行複雜且複合的處理，並對其加以管理的函式庫」**。

### ３．把 Modifier 套用到 attackPower

接著，來寫「角色進行攻擊」的處理。

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	public int health = 3;

	// baseValue 是數值變動的基礎值
	public ModifiableInt attackPower = new ModifiableInt(baseValue: 2);

	public void Attack (Character target) {
		target.health -= attackPower.Evaluate();
	}

}
```

這裡最重要的是 **attackPower.Evaluate()**。

Evaluate 函式是實作在 ModifiableInt（以及 ModifiableProperty）上的函式，它所做的是 **「把加入到自身的所有 Modifier 套用到基礎值（baseValue）上」**。

如果你把它想成前面介紹過的「套用倍率清單的處理」，應該就會比較好理解。

所以，假設現在是以下狀態：

-   attackPower 的基礎值是 2
-   attackPower 上加入了「加算量為 1 的 AdditiveModifier」

此時執行 attackPower.Evaluate()，

因為 **「2（baseValue）+ 1（AdditiveModifier）」**，所以回傳值就會是「3」。

這樣一來，使用 Modiferty 的實作就完成了。

## 結語

這個函式庫採用 MIT 授權，因此可以非常自由地使用。

我實際上也在自己的遊戲中使用它，而且基本上只要：

-   用 ModifiableProperty 宣告數值
-   變更數值時使用 Modifier

就能很輕鬆地導入，所以如果你覺得「好像派得上用場」，不妨試試看。

[![](./cover.png)](https://github.com/mackysoft/Modiferty)

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)
