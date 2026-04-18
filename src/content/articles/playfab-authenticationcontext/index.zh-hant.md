---
title: "【PlayFab】什麼是 PlayFabAuthenticationContext？【Unity】"
description: "使用 PlayFab 時，我看到許多 Request 都能指定 PlayFabAuthenticationContext，於是開始思考它到底是什麼。本文整理了我查到的內容，並說明它在實務上代表的意義。"
cover: "./cover.png"
coverAlt: "【PlayFab】什麼是 PlayFabAuthenticationContext？【Unity】的文章封面圖片"
---

## 前言

使用 PlayFab 的時候，我常常會想：「可以指定在各種 Request 上的 `PlayFabAuthenticationContext` 到底是什麼？」因此我特地查了一下這個型別。

`PlayFabAuthenticationContext` 這個名稱有點長，以下會簡稱為 AuthenticationContext。

## 什麼是 AuthenticationContext？

如果直接把 AuthenticationContext 翻成字面意思，就是「認證的上下文」。這樣聽起來其實還是很難理解。

為了弄清楚「認證的上下文」到底代表什麼，我們先來看看 `PlayFabAuthenticationContext` 上定義的幾個成員與方法。

### string PlayFabId

這是用來識別玩家的 ID。

例如，當你想在排行榜上只強調顯示自己的那一筆資料時，就可以用到它。

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

這個方法會回傳玩家目前是否已經登入。

```cs

using PlayFab;

// Check whether the context is logged in
public bool IsClientLoggedIn (PlayFabAuthenticationContext context) {
	return context.IsClientLoggedIn();
}
```

光看這兩個成員，大概就能稍微理解「認證的上下文」是在描述什麼。

## 如何取得目前的玩家

可以用下面的方式取得目前的玩家，也就是 `staticPlayer`。

```cs

using PlayFab;

// Get the current player
PlayFabAuthenticationContext player = PlayFabSettings.staticPlayer;

// This method can check the login status of PlayFabSettings.staticPlayer.
PlayFabClientAPI.IsClientLoggedIn();
```

在 PlayFab 中，多數情況下實際使用的都是這個 `staticPlayer`。

## 各種 Request 都可以指定 AuthenticationContext

在 PlayFab 裡，我們經常會操作各種 Request 物件，而這些 Request 其實都能設定 AuthenticationContext。

先來看看 Request 類型的定義。

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

如果你沒有在 Request 物件上明確指定 AuthenticationContext，就會改用 `PlayFabSettings.staticPlayer`。

因此大多數情況下，其實不太需要手動指定 AuthenticationContext。

## 結語

目前我對 PlayFab 的理解還不夠深，所以現階段能想到 AuthenticationContext 的主要用途，大概就是確認玩家 ID，以及確認登入狀態。

不過在查資料的過程中，我也有看到幾個會用到 AuthenticationContext 的 API，之後有機會再另外研究。

## 參考資料

-   [C# ServerInstanceAPI：authenticationContext 的用途是什麼？](https://community.playfab.com/questions/36560/c-serverinstanceapi-what-is-the-purpose-of-authent.html)
