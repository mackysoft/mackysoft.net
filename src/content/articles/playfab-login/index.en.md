---
title: "【PlayFab】Generating IDs and Logging In【Unity】"
description: "This article uses PlayFab SDK 2.86.2005 18. PlayFab has many features, but the first thing you need to do before using them is log in. This article explains the two login types: anonymous login and recoverable login."
cover: "./cover.png"
coverAlt: "Article image for 【PlayFab】Generating IDs and Logging In【Unity】"
---

Version used in this article

-   PlayFab SDK: 2.86.2005 18

## Introduction

PlayFab has many features, but the first thing you need to do to use them is log in.

## There are two types of login: "anonymous login" and "recoverable login"

Broadly speaking, PlayFab offers two login methods.

### Anonymous login

This is the simplest login method.

Because the user does not need to enter any information, the game can handle login automatically.

That means you do not end up with things like **"Logging in is such a hassle, I might as well quit."** (important)

The downside is that if the player loses the device, recovery becomes difficult.

#### Functions for anonymous login

-   [LoginWithIOSDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithiosdeviceid)
-   [LoginWithAndroidDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithandroiddeviceid)
-   [LoginWithCustomID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithcustomid)

#### Example implementation of anonymous login

```cs

using UnityEngine;
using PlayFab;
using PlayFab.ClientModels;

// Sample implementation using LoginWithCustomID
public void Login (string id) {
	bool shouldCreateAccount = string.IsNullOrEmpty(id);

	PlayFabClientAPI.LoginWithCustomID(
		new LoginWithCustomIDRequest {
			CustomId = shouldCreateAccount ? CreateNewId() : id,
			CreateAccount = shouldCreateAccount
		},
		result => {
			// Success handling
			Debug.Log("Login successfully");
		},
		error => {
			// Failure handling
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}

// Generate a unique ID
string CreateNewId () {
	return System.Guid.NewGuid().ToString();
}
```

### Recoverable login

This is a login method that lets the account be recovered if something happens to the device.

However, it requires the player to provide information such as the following:

-   Authenticate through an external provider (Facebook, iOS, Google, and so on)
-   Enter a username or email address and a password

For that reason, if you ask the player to use this login method right after installing the game, you will get **"Logging in is such a hassle, I might as well quit."** Be careful when you use it.

If you combine it with anonymous login, you can let players start anonymously and later guide them toward a recoverable login. (See: [Quickstart for account linking](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/quickstart))

#### Functions for recoverable login

-   [LoginWithPlayFab](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithplayfab)
-   [LoginWithEmailAddress](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithemailaddress)

You can also log in through third-party services using the following methods:

-   [LoginWithKongregate](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithkongregate)
-   [LoginWithSteam](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithsteam)
-   [LoginWithTwitch](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithtwitch)
-   [LoginWithFacebook](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithfacebook) (separate SDK required)
-   [LoginWithGoogleAccount](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithgoogleaccount) (separate SDK required)
-   [LoginWithWindowsHello](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithwindowshello) (separate SDK required)

## Closing Thoughts

At the moment, I am still in the middle of introducing PlayFab into a project and learning as I go.

If I have made any mistakes, I would appreciate it if you let me know.

## References

-   [Login basics and best practices](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/login-basics-best-practices)
-   [Player login](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/)
-   [PlayFab setup in Unity, login flow, and per-user custom ID generation](https://kan-kikuchi.hatenablog.com/entry/PlayFabLogin)
