---
title: "[Tsukuru UOZU] Organizing Osho's Mentoring Notes [BOOT CAMP 2020 Part 1]"
description: "UOZU GAME BOOT CAMP is a game creator training program that is part of the Tsukuru UOZU project, where professional creators mentor game development. In this article, I organize the feedback Osho gave me on Treasure Rogue's game design."
---

## Introduction

[BOOT CAMP](https://www.uozugame.com/) is a game creator training program that is part of the "Tsukuru UOZU" project, and it gives game developers mentoring from professional creators.

As with the previous boot camp, Osho ([@Kumanbow](https://twitter.com/Kumanbow)) mentored [Treasure Rogue](https://play.google.com/store/apps/details?id=com.MackySoft.TreasureRogue).

In this article, I organize the feedback he gave me on the game's overall design. I will leave out feedback on small details and game feel.

## Three Responses

During this mentoring session, I brought up my vague concerns that the game was becoming repetitive and that I did not feel like playing again, and Osho gave me three main responses:

-   The pacing is too flat
-   There is no progression to build on
-   The long-term goal is too weak

## The Pacing Is Too Flat

**"If the pacing is too flat, the same kind of experience keeps repeating, and the randomness stops feeling random."** That was his point.

This idea of "pacing" lines up with the earlier article I wrote about [contrast](/articles/gamedesign-contrast-cedec2018/).

Since then, I have been working on [a system that adds pacing to enemy strength](/articles/roguelike-random-enemy-select/), and in this mentoring session Osho gave me a new perspective: add pacing to map generation as well.

## No Structure for Replayability

**"There is no structure that makes you want to replay."** That was his other point.

One example Osho gave was "progression that accumulates over time."

### Persistent Progression

Roguelike games generally make you lose the money and items you have when you die in a dungeon. _Treasure Rogue_ is the same.

However, he pointed out that games like _Torneko: The Last Hope_ and _Shiren the Wanderer_ actually include elements that accumulate beyond the player's skill.

He told me I could feel this kind of progression by playing _Battle Dash_, so I tried the game he recommended, [Battle Dash](http://www.oridio.jp/works/app021.html).

### The Structure of Battle Dash

What I learned from playing it was that it has a structure that makes you want to try things out.

1.  Play
2.  Accumulate currency
3.  Upgrade weapons and other things with the currency
4.  Play again because you want to try the stronger setup

That loop was already there.

The game itself is pretty simple, but with that structure, you end up wanting to keep playing.

I also felt this when I played _Slay the Spire_: games that keep pulling you back are good at making you think, "I can do better next time."

### Wanting to Try Things Out

If I abstract the structure that keeps you playing one step further, it looks like this:

1.  Play
2.  There is something you want to try out
3.  Play again

I think that is probably the **"structure that makes you want to replay."**

Things that make you want to try something out might be progression elements or a huge amount of content. Randomness is something that amplifies those.

If I were to add something like that to _Treasure Rogue_, I would want to implement a feature where, before a run starts, you can spend the currency you have saved to randomly buy treasures that grant passive skills.

It would be interesting to start a run with a passive skill that affects how you play and then think through item synergies as you go.

## Weak Long-Term Goals

At the moment, _Treasure Rogue_'s only goal is to chase the highest distance traveled.

That alone is not enough to keep motivation going, so Osho also gave a few examples of "structures that make you want to replay":

-   100 diamonds are required to reach the legendary treasure. (This would also help make the "treasure" in "Treasure Rogue" feel more real.)
-   A championship for "how far can you go?"
-   Every 1,000 meters, there is a rare item. If you collect a few of them, you can get something amazing.

He said that having a goal like that inside the game's world helps motivate the next run.

## Closing Thoughts

It was another really useful mentoring session. Thanks, Osho!

I want to have fixed everything he pointed out by the next mentoring session on 08/27.
