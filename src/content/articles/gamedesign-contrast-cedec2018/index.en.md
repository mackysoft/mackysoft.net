---
title: "How Contrast Makes Games Fun [Game Design]"
description: "I read an article about why games fail to become fun when context, conflict, and contrast are out of sync, and then applied that idea to the game I am actually making."
publishedAt: "2020-05-29T20:00:05+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "game-design"
---

## Introduction

I read [this article](https://jp.gamesindustry.biz/article/1809/18090402/) titled "［CEDEC 2018］The reason games are not fun lies in a mismatch between context, conflict, and contrast."

In this article, I will not only summarize the original piece, but also talk about **how I would actually improve the game I am making**.

I hope you will read this alongside the source article.

This time, I will focus on one of the three sections: **contrast**.

## "It does not feel satisfying" = a lack of contrast

> Contrast is about light and dark. If a game does not feel satisfying, that means it lacks tension, impact, excitement, and drama.
> In other words, this can be explained by a lack of contrast within the game. Games feel satisfying because of contrasts such as success and failure, stillness and motion, excitement and quiet, or light and dark in the characters.

In short, **"without contrast, things become monotonous and boring."**

I am dealing with this exact problem right now: **a lack of contrast**.

I am working on a [roguelike game](/games/treasure-rogue/), and after playing it for a little while, it starts to feel repetitive. That was not just my impression during playtests; reviewers and even my parents pointed it out too.

> A common mistake for beginner game developers is level design where the difficulty rises in a straight line in proportion to play time. That makes contrast hard to create, because contrast is about comparison. In other words, it comes from creating a gap from what came just before.
> If you instead raise the difficulty a little, then lower it, and then raise it again from there in small steps, each rise and fall creates contrast, or "merihari."

If difficulty keeps climbing in a straight line, it becomes harder to create contrast. That is why you need to create a gap from the experience just before.

For example, **a Hammer Bro feels tense precisely because it is placed between Goombas and Koopa Troopas**.

In my own game, the difficulty is also trending upward in a straight line. The number of enemies basically keeps increasing, and I had not been thinking at all about **reducing** enemy numbers.

> For example, in God of War III, when enemies attack in waves, the game does not simply increase the enemy count every time a new wave begins. Instead, it sometimes lowers the number, or mixes in different enemy types, to add contrast.

That example was extremely helpful.

If I were to bring the idea of contrast into my game, I would probably focus on things like:

-   Adjusting the number and types of enemies generated at each level so that the gaps are not completely random, but still create some contrast
-   Adjusting item appearance rates and item strength

Since my game is a pure roguelike, manipulating those probabilities would be the main approach. In the original article, I think this would correspond to **"excitement and quiet."**

In other genres, as the opening quote suggests, it may be worth consciously building in contrast around things like **success and failure, stillness and motion, excitement and quiet, or light and dark in the characters**.

## Closing thoughts

The section on contrast ends with this line:

> However, this is not a question of whether a straight-line difficulty curve or a contrast-based design is universally correct. If you want to create satisfaction by adding clear peaks and valleys, the latter is effective, Oono said.

For example, **forcing contrast into a slow, relaxed game would probably just make it tiring**.

Remember that contrast is only **one technique**.

## References

-   [［CEDEC 2018］The reason games are not fun lies in a mismatch between context, conflict, and contrast](https://jp.gamesindustry.biz/article/1809/18090402/)
-   [［GDC 2016］An interview with Atsushi Inaba of PlatinumGames about the essence of action game development and how to make games that can compete globally](https://www.4gamer.net/games/260/G026029/20160318174/)
