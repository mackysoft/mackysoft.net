---
title: "[Unity] Implementing a Defense Buff with ModifierList [Modiferty]"
description: "Modiferty is a stat management library. If you are not familiar with it yet, the article below will help you understand the basics."
publishedAt: "2020-05-24T00:42:00+09:00"
updatedAt: "2020-05-24T15:10:23+09:00"
tags:
  - "modiferty"
  - "unity"
cover: "./cover.png"
coverAlt: "Article image for [Unity] Implementing a Defense Buff with ModifierList [Modiferty]"
---

## Introduction

Modiferty is a stat management library.

If you are not familiar with the overview of Modiferty, the article below will make it easier to understand.

[Using Modiferty for Game Stat Management [Unity]](/articles/modiferty-introduction/)

## What is ModifierList?

Where ModifiableProperty is used to change individual stats,

ModifierList can **change the value it is given**.

For example, it lets you do something like preprocess damage before it is applied. (In Pokémon terms, think "Iron Defense"; in Dragon Quest terms, it is similar to "Sukara".)

## Concrete implementation example

Let's actually implement **"a process that reduces incoming damage"**.

### 1. Declare a ModifierList

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// Character health
	public int health = 3;

	// ModifierList that preprocesses incoming damage
	public ModifierList<int> damageModifiers = new ModiferList<int>();

}
```

If the health type is float instead of int, use ModifierList<float>.

Now we are ready to reduce incoming damage.

### 2. Add a Modifier to the ModifierList

Next, we will implement an item that raises the character's defense.

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

When a character collides with this DefenseUpItem, SubstractiveModifierInt (a modifier that subtracts a value) is added to that character's damageModifiers.

In other words, the damage that character receives can be reduced.

In this example we used SubstractiveModifierInt, but if you want to implement something like "reduce damage by 10%", you can use MultiplyModifier, and so on.

### 3. The damage-taking process

Implement the character's damage-taking behavior.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// Character health
	public int health = 3;

	// ModifierList that preprocesses incoming damage
	public ModifierList<int> damageModifiers = new ModiferList<int>();

	public int attackPower = 2;

	// Damage-taking process
	public void TakeDamage (Character attacker) {

		// Apply damageModifiers to the incoming damage
		health -= damageModifiers.Evaluate(attacker.attackPower);

	}

}
```

The important part is **damageModifiers.Evaluate(attacker.attackPower)**.

The ModifierList Evaluate function applies changes to attacker.attackPower.

If the defending character had been affected by the DefenseUpItem,

**2 (the attacking character's attack power) - 1 (the subtraction amount of SubstractiveModifierInt)**

the damage taken becomes 1.

### 4. Remove a Modifier from the ModifierList

You cannot keep a character permanently strengthened by "Iron Defense" or "Sukara". When it is time to remove the effect, delete the Modifier from the ModifierList.

It can be used much like List<T>, and it also adds some convenient helper methods.

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

That completes the implementation of "a process that reduces incoming damage."

## Closing Thoughts

Modiferty is MIT licensed, so you can use it very freely.

If it sounds useful, give it a try.

[![](./cover.png)](https://github.com/mackysoft/Modiferty)

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)
