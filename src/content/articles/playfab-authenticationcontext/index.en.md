---
title: "【PlayFab】What Is PlayFabAuthenticationContext?【Unity】"
description: "When I was using PlayFab, I wondered what PlayFabAuthenticationContext was whenever I saw it passed to various ○○Request types, so I looked into it. From here on, I will just call it AuthenticationContext."
cover: "./cover.png"
coverAlt: "Article image for 【PlayFab】What Is PlayFabAuthenticationContext?【Unity】"
---

## Introduction

When I was using PlayFab, I found myself wondering what `PlayFabAuthenticationContext` was when it could be passed to various `○○Request` types, so I looked into it.

Since PlayFabAuthenticationContext is a bit long, I will call it AuthenticationContext from here on.

## What Is AuthenticationContext?

A literal translation of AuthenticationContext is "the context of authentication." Not very helpful.

To understand what "the context of authentication" means, let's look at some of the members and methods defined on PlayFabAuthenticationContext.

### string PlayFabId

This is the ID used to identify a player.

For example, you can use it when you want to highlight only your own entry on the leaderboard.

```cs

using UnityEngine;
using UnityEngine.UI;
using PlayFab;
using PlayFab.ClientModels;

// UI for a leaderboard entry
public class LeaderboardEntryUI : MonoBehavour {

	// UI used to highlight the entry
	public Image focusImage;

	public void SetEntry (PlayerLeaderboardEntry entry) {
		// Highlight the UI if the leaderboard entry and the current player's PlayFabId match
		focusImage.enabled = (entry.PlayFabId == PlayFabSettings.staticPlayer.PlayerId);
	}
}
```

### bool IsClientLoggedIn ()

This is a method that returns whether the player is logged in.

```cs

using PlayFab;

// Check whether the context is logged in
public bool IsClientLoggedIn (PlayFabAuthenticationContext context) {
	return context.IsClientLoggedIn();
}
```

* * *

Looking at these two members, we now have a rough idea of what "the context of authentication" means.

## How to Get the Current Player

You can get the current player (`staticPlayer`) in the following way.

```cs

using PlayFab;

// Get the current player
PlayFabAuthenticationContext player = PlayFabSettings.staticPlayer;

// This method can check the login status of PlayFabSettings.staticPlayer.
PlayFabClientAPI.IsClientLoggedIn();
```

In many cases, PlayFab uses this `staticPlayer`.

## ○○Request Can Accept AuthenticationContext

PlayFab makes heavy use of `○○Request` types, and AuthenticationContext can actually be assigned to them.

Let's look at the definition of a `○○Request`.

```cs

// In PlayFab, all ○○Request types inherit from PlayFabRequestCommon
public class PlayFabRequestCommon : PlayFabBaseModel
{
	public PlayFabAuthenticationContext AuthenticationContext;
}

// For example, GetLeaderboardAroundPlayerRequest also inherits from PlayFabRequestCommon
[Serializable]
public class GetLeaderboardAroundPlayerRequest : PlayFabRequestCommon
{
	// omitted
}
```

If you do not specify AuthenticationContext on a `○○Request`, PlayFabSettings.staticPlayer will be used instead.

In most cases, you do not need to specify AuthenticationContext.

## Closing Thoughts

At this point I still do not know enough about PlayFab to say more than that the useful uses of AuthenticationContext seem to be checking the ID and checking the login status.

However, while researching it I found a few APIs that use AuthenticationContext, so I plan to look into them another time.

## References

-   [C# ServerInstanceAPI: what is the purpose of authenticationContext?](https://community.playfab.com/questions/36560/c-serverinstanceapi-what-is-the-purpose-of-authent.html)
