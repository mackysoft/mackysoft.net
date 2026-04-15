---
title: "[PlayFab] What Is PlayFabAuthenticationContext? [Unity]"
description: "While using PlayFab, I started wondering what PlayFabAuthenticationContext actually was whenever I saw it attached to various request types, so I dug into it. From here on, I will simply call it AuthenticationContext."
cover: "./cover.png"
coverAlt: "Article image for [PlayFab] What Is PlayFabAuthenticationContext? [Unity]"
---

## Introduction

While using PlayFab, I found myself wondering what `PlayFabAuthenticationContext` actually was whenever I saw it attached to various request types, so I looked into it.

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
public class LeaderboardEntryUI : MonoBehaviour {

	// UI used to highlight the entry
	public Image focusImage;

	public void SetEntry (PlayerLeaderboardEntry entry) {
		// Highlight the UI if the leaderboard entry and the current player's PlayFabId match
		focusImage.enabled = (entry.PlayFabId == PlayFabSettings.staticPlayer.PlayFabId);
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

## Request Types Can Accept AuthenticationContext

PlayFab makes heavy use of request objects, and AuthenticationContext can actually be assigned to them.

Let's look at the definition of one of those request objects.

```cs

// In PlayFab, all request types inherit from PlayFabRequestCommon
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

If you do not specify AuthenticationContext on a request object, PlayFabSettings.staticPlayer will be used instead.

In most cases, you do not need to specify AuthenticationContext.

## Closing Thoughts

At this point I still do not know enough about PlayFab to say much more than that the main uses of AuthenticationContext seem to be checking the player's ID and login status.

However, while researching it I found a few APIs that use AuthenticationContext, so I plan to look into them another time.

## References

-   [C# ServerInstanceAPI: what is the purpose of authenticationContext?](https://community.playfab.com/questions/36560/c-serverinstanceapi-what-is-the-purpose-of-authent.html)
