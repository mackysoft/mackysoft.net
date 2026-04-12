---
title: "How I Learned to Finish Games After It Took Me Six Years to Release My First One"
description: "Hi, I'm Makihiro (@makihiro_dev). Game development is hard, isn't it? As people say, 1,000 want to make games, 100 actually start, 10 keep going, and only 1 finishes. Drawing from my own experience, I explain how to finish a game."
publishedAt: "2020-06-23T21:33:13+09:00"
updatedAt: "2021-07-14T02:19:54+09:00"
tags:
  - "misc"
cover: "./cover.jpg"
coverAlt: "Article image for How I Learned to Finish Games After It Took Me Six Years to Release My First One"
---

Hi, I'm Makihiro ([@makihiro\_dev](https://twitter.com/makihiro_dev)).

Game development is tough. As they say out there,

> 1,000 people want to make a game
>
> 100 people actually start making one
>
> 10 people keep making games
>
> 1 person finishes a game

That is how hard game development can be.

In this article, I'll draw from my own experience to explain how to finish a game.

Before that, though, let me briefly talk about my background in game development.

## My Background

I've been making games for six years. I develop games on my own.

For the first five years, I could not release a single game. During that time, more than 10 projects disappeared into the void.

Then, in the sixth year, I finally managed to release my first game.

[https://twitter.com/makihiro_dev/status/1234444358067216387?s=20](https://twitter.com/makihiro_dev/status/1234444358067216387?s=20)

Now, let's get to the main topic.

## Games Don't Get Finished

First of all, let me crush the misconception that people who cannot finish games probably have.

**Games do not get finished.**

When you are making a game, ideas keep pouring out: "I want to do this," "I want to add that," "If I improve this part, it will be even better." Even when you are working on a tiny minigame, ideas keep bubbling up as you go.

My already released game, _Treasure Rogue_, still has more than 50 tasks left. Most of them appeared after release. By the time I finish those tasks, I am sure another 50 or so new tasks will have surfaced.

As long as you are developing games, think of these tasks as something that will keep appearing forever.

Game development is an **infinite task hell**.

**Game development has no finish line.**

### Finishing a Game

![](./cover.jpg)

Since there is no such thing as "finished," we should instead **finish** the game.

In short, that means getting it to a state where it has the **minimum game loop, minimum content, minimum graphics, and is in a state where the game can actually be played**.

Once you have reached that point, I think it is perfectly fine to release the game. In fact, if you do not release it there, you will get trapped in infinite task hell, so it is better to release it.

In practice, I released _Treasure Rogue_ on the store while it was still at the stage of having the minimum game loop, the minimum number of enemies, items, and maps, and the minimum graphics.

Honestly, that is pretty bare-bones for a roguelike, but it is still better than getting trapped in infinite task hell and never releasing it.

And more than anything else, what deserves to be condemned is **failing to define what counts as "done"**.

I was guilty of this myself: I chased the vague illusion of "completion" without ever deciding what would count as done. If you do that, you will be trapped in infinite task hell and the game will never be finished.

When you start making a game, first set a concrete standard for "this is enough to call it done."

Just finish the game and release it.

**A bad game that has been released is more valuable than a masterpiece that never sees release.**

## Why Games Don't Get Finished

From here on, I will look back on the projects I have turned into vapor and summarize the factors that kept those games from being finished.

### Too Many MP-Draining Tasks

![](./ベビーサタン-MPが足りない.jpg)

People have a limited amount of MP they can spend on work. But once you run out of MP, your head and body feel heavy and you can no longer work, even if you want to.

**So, try to keep MP consumption as low as possible.**

As for when MP gets drained, it differs from person to person, so there is no one-size-fits-all answer.

For example, in my case, I burn through MP on "modeling" and "stage creation," so I try to keep those tasks out of game development whenever possible.

- If modeling is the problem, use the simplest possible model.
- If stage creation is the problem, generate the stages automatically.

In short, keep the tasks that drain a lot of MP for you to an absolute minimum.

Most of the factors I will introduce from here on ultimately come down to heavy MP consumption.

#### A Failure Story

I tried to make a puzzle game centered on stage clearing, but I gave up because I could not make the stages.

### Trying to Use Technology You Have Never Used Before

If you try to use technology you have never used before, your design becomes a mess.

Once the design gets messy, building and maintaining the project becomes painful, and you end up wasting MP for no reason.

**Do not use technology you have never used before. At most, keep it to one unfamiliar technology, or learn it through a prototype.**

#### The Story of Not Introducing AssetBundle

For example, in my current _Treasure Rogue_, I do not load assets through AssetBundle. That is because I have never finished a game using AssetBundle.

AssetBundle can reduce an app's size, and nowadays there is the convenient Addressables system, so it is tempting to use technology you have not touched before. But I prioritize finishing the game.

So, for Unity object references, I keep it simple and just use drag and drop in the Inspector.

#### A Failure Story

I added unfamiliar technology, and MP got chewed up so badly that I gave up.

### Not Being Able to Feel Attached to It

This may sound romantic, but attachment matters quite a bit.

**If you cannot feel attached to a game, you will lose the motivation to keep making it.**

If your motivation to make the game drops, that means your maximum MP has gone down.

So when you first decide on things like the game's graphics and gameplay, it is worth thinking them through until you are truly satisfied.

#### A Failure Story

I could not feel attached to the model I made, and I gave up.

### Starting a New Game Without Thinking It Through

![](./NewIdea-vs-CurrentProject.png)

This is the pattern where you are so eager to make a game that you start a new one without thinking.

In particular, the beginning of a project is incredibly fun, so when your motivation for the game you are currently making starts to fade, you are especially vulnerable to the temptation of a new game idea.

**Do not give in to this temptation. Ever.**

Games started on impulse like this usually turn out, somewhere during development, to be stuffed with unfamiliar technology or to have some other fatal flaw.

Also, when people give in to this temptation, they often think something like, "I'll just resume the game I paused later." But **in my experience, games that get paused do not get resumed.**

After all, who wants to touch a project they themselves created ages ago when it is all messy and tangled?

And then you end up falling into a spiral of infatuation: "I gave in to temptation, started a new game without thinking, noticed a flaw..." So when you start a new game, plan it carefully and do not lose to temptation.

## How to Build the Ability to Finish

"Finish ability" is exactly what it sounds like: the ability to finish a game.

"Game development beginners" and "people who cannot finish games" should first learn how to finish.

### Do a Tutorial

Whether it is the [official Unity tutorial](https://learn.unity.com/) or a beginner game development book, anything is fine. Just do a tutorial that has a clear path all the way to completion at least once.

That will help you understand the flow from start to finish.

I stubbornly wanted to start with "my own game first!" and, because of that unnecessary fixation, I did not do a tutorial at all until my fourth year of development. On top of that, the game I was making was complicated, so I never developed finish ability.

**Fixations like that only stall things, so they are seriously useless.**

By the way, I now divide things into "'Treasure Rogue' was my first project, the tutorial was practice," which makes me think, "Yeah, that fixation was truly unnecessary."

**Throw away unnecessary fixations right now.** Your future self will conveniently reframe things for you.

### Try Making a Game in One Week

Once you have grasped the flow of game development through a tutorial, try making your own game in one week.

Doing that will quickly build your finish ability.

**After all, four months after I did this, I was able to release _Treasure Rogue_.**

On the first run, my "finish ability" clearly improved, and on the second run, it had firmly taken root.

**What matters here is building only the minimum game loop. In other words, finishing the game.**

Two years ago, I took part in an event called [Unity 1 Week](https://unityroom.com/unity1weeks), but at the time I could not bring my game to a state where it was even minimally playable.

Even so, I published it thinking, "If I put something out there for now, maybe I will gain the mindset needed to finish games." But as experience goes, it was not very effective. In the end, it still took two more years before I could make a proper release.

**So lower the development hurdle to the point where you feel like, 'Isn't this too little?'**

"Make one stage playable. Implement one weapon. Use one enemy type." That is enough. Honestly, even that may still be too high.

### Publish It

Once the game is finished, make sure to publish it.

**Even if it is a bad game.**

If you do not publish it, you will never get the real sense that "the game is finished," and you will keep working on it forever, trapped in infinite task hell.

**Publishing the game is extremely important as a way to mark a boundary.**

The image below is a list of games I posted on unityroom, and everything from the tutorial projects to the one-week games has been published there.

![](./unityroom-profile-e1592908309387.png)

_Makihiro | unityroom_

**Game development continues until people can actually play the game.**

## Closing Thoughts
