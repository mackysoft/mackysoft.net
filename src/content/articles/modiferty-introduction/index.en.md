---
title: "[Unity] Using Modiferty for Game Stat Management [Modiferty]"
description: "I built a library called Modiferty while making a game and published it on GitHub. It is broadly useful in games where characters and weapons have stats."
publishedAt: "2020-05-21T01:23:04+09:00"
updatedAt: "2020-05-27T13:58:20+09:00"
tags:
  - "asset"
  - "modiferty"
  - "unity"
cover: "./cover.png"
coverAlt: "Article image for [Unity] Using Modiferty for Game Stat Management [Modiferty]"
---

## Introduction

I ended up building a pretty nice library while making a game, so I published the library **[Modiferty](https://github.com/mackysoft/Modiferty)** on GitHub!

This library is broadly useful in games where characters and weapons have a concept of stats.

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)

## What is Modiferty?

Modiferty excels at managing changes to the stats of characters and weapons in a game.

-   You can see what kind of change was made, such as whether a value was doubled or increased by 1, etc.
-   You can manage multiple rounds of stat changes.

That alone may still leave you wondering what it actually does, so let me walk through a concrete example.

## Implementing a stat boost

When you want to implement a temporary stat boost for a character in a game, what do you do? (Think Pokémon's Swords Dance or Dragon Quest's Bikill.)

The two main approaches I can think of are:

1.  Overwrite the stat value
2.  Prepare a variable like "attack power multiplier" and apply the multiplier when attacking

### 1. Overwrite the stat value

```cs

using UnityEngine;

public class Character : MonoBehaviour {

	public int health = 3;
	public int attackPower = 2;

	// Attack processing
	public void Attack (Character target) {
		// Deal damage equal to the current attack power
		target.health -= attackPower;
	}

	// Increase attack power
	public void PowerUp (int additionalAttackPower) {
		attackPower += additionalAttackPower;
	}
}
```

This is simple, but it has a lot of drawbacks.

-   Because you cannot tell what kind of stat change occurred, you cannot create effects like "increased by 1 from the initial value."
-   It becomes difficult to manage "mixed additive and multiplicative changes" or other complex modifications.

### 2. Prepare an "attack power multiplier" and apply it when attacking

```cs

using UnityEngine;
using System.Collections.Generic;

public class Character : MonoBehaviour {

	public int health = 3;
	public int attackPower = 2;

	// List of multipliers
	public List<float> attackPowerMultiply = new List<float>();

	// Attack processing
	public void Attack (Character target) {
		int multipiedAttackPower = attackPower;

		// Apply the multipliers to the attack power
		foreach (float multiply in attackPowerMultiply) {
			multipliesAttackPower *= multiply;
		}

		// Deal damage based on the modified attack power
		target.health -= multipliedAttackPower;
	}
}
```

With this approach, you can see what kind of stat change is happening, so you can build effects around that.

However, this only supports multipliers, so it is not very extensible.

Modiferty is a library that solves the problems described above.

-   You can see what kind of change was made, such as whether a value was doubled or increased by 1, etc.
-   You can manage multiple rounds of stat changes.

## A concrete implementation example

Here, I will show an example of a character whose attack power changes.

### 1. Declare attackPower with ModifiableProperty

First, declare the numbers you want to make mutable, such as a character's attack power, with **ModifiableProperty** instead of int or float.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	// The base value used as the starting point for modifications
	public ModifiableInt attackPower = new ModifiableInt(baseValue: 2);

}
```

This time we use ModifiableInt instead of int. (If you want float, use ModifiableFloat instead.)

Now we can manage changes to the character's attack power.

### 2. Add a Modifier

Next, let's create an item that increases the attack power of the character it touches.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class PowerUpItem : MonoBehaviour {

	// Amount to add
	public AdditiveModifierInt additiveAttackPower = new AdditiveModifierInt(amount: 1);

	void OnCollisionEnter (Collision collision) {
		Character target = collision.collider.GetComponentInParent<Character>();
		if (target != null) {
			// Add a Modifier that increases the value by 1 to attackPower.Modifiers
			target.attackPower.Modifiers.Add(additiveAttackPower);
		}
	}
}
```

You may be thinking, "What exactly is AdditiveModifierInt?"

Simply put, AdditiveModifierInt is one of the important concepts in Modiferty: a **Modifier**.

In this example, you can see that the Modifier additiveAttackPower is being added to the touched Character's attackPower.Modifiers. (It can also be removed.)

This Modifier plays a role similar to the multiplier list shown earlier.

In this example I used AdditiveModifier (addition), but Modiferty also includes modifiers for all four arithmetic operations, as well as modifiers for special kinds of changes. ([Modiferty - Modifier Types](https://github.com/mackysoft/Modiferty#modifier-types))

In other words, Modiferty is a library that lets you **perform complex, combined processing on values and manage the result**.

### 3. Apply the Modifier to attackPower

Next, write the character's attack action.

```cs

using UnityEngine;
using MackySoft.Modiferty;

public class Character : MonoBehaviour {

	public int health = 3;

	// The base value used as the starting point for modifications
	public ModifiableInt attackPower = new ModifiableInt(baseValue: 2);

	public void Attack (Character target) {
		target.health -= attackPower.Evaluate();
	}

}
```

The important part is **attackPower.Evaluate()**.

The Evaluate function is implemented on ModifiableInt (and ModifiableProperty), and it **applies all modifiers attached to the property to the baseValue**.

If you think back to the earlier "apply the multiplier list" example, this should make sense.

So if:

-   attackPower's base value is 2
-   an AdditiveModifier with an amount of 1 is added to attackPower

then when you run attackPower.Evaluate(),

**2 (baseValue) + 1 (AdditiveModifier)** means the return value is 3.

* * *

That completes the Modiferty implementation.

## Closing Thoughts

This library is MIT licensed, so you can use it very freely.

I also use it in my own game, and it is easy to adopt because you mainly just need to:

-   Declare values with ModifiableProperty
-   Use modifiers when changing those values

If it sounds useful, give it a try.

[![](./cover.png)](https://github.com/mackysoft/Modiferty)

GitHub: [https://github.com/mackysoft/Modiferty](https://github.com/mackysoft/Modiferty)
