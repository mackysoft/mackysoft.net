---
title: "【PlayFab】PlayFabAuthenticationContextとは？【Unity】"
description: "はじめに PlayFabを使っているときに「○○Requestに指定できるPlayFabAuthenticationContextって何だろう？」と思ったので、PlayFabAuthenticationContextにつ … 【PlayFab】PlayFabAuthenticationContextとは？【Unity】"
publishedAt: "2020-05-27T20:00:00+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】PlayFabAuthenticationContextとは？【Unity】 の記事画像"
---

## はじめに

PlayFabを使っているときに「○○Requestに指定できるPlayFabAuthenticationContextって何だろう？」と思ったので、PlayFabAuthenticationContextについて調べました。　

PlayFabAuthenticationContextだと長いので、以下からはAuthenticationContextと呼ぶことにします。

## AuthenticationContextとは？

AuthenticationContextを直訳すると「認証の文脈」です。分からん。

まず「認証の文脈」とは何なのかを理解するため、PlayFabAuthenticationContextに定義されているいくつかのメンバと関数を見てみましょう。

### string PlayFabId

これはプレイヤーを識別するためのIDです。

例えば **「リーダーボードで自分のエントリーだけ強調表示したい」** というようなときに使用できます。

```cs

using UnityEngine;
using UnityEngine.UI;
using PlayFab;
using PlayFab.ClientModels;

// リーダーボードのエントリーのUI
public class LeaderboardEntryUI : MonoBehaviour {

	// 強調表示するためのUI
	public Image focusImage;

	public void SetEntry (PlayerLeaderboardEntry entry) {
		// リーダーボードのエントリーと現在のプレイヤーのPlayFabIdが一致したらUIで強調表示する
		focusImage.enabled = (entry.PlayFabId == PlayFabSettings.staticPlayer.PlayFabId);
	}
}
```

### bool IsClientLoggedIn ()

これはプレイヤーがログインしているかどうかを取得するための関数です。

```cs

using PlayFab;

// コンテクストがログインしているかどうかをチェックする
public bool IsClientLoggedIn (PlayFabAuthenticationContext context) {
	return context.IsClientLoggedIn();
}
```

* * *

この２つを見ると「認証の文脈」がなんなのか少しわかりましたね。

## 現在のプレイヤーを取得する方法

以下の方法で、現在のプレイヤー（staticPlayer）を取得することができます。

```cs

using PlayFab;

// 現在のプレイヤーを取得
PlayFabAuthenticationContext player = PlayFabSettings.staticPlayer;

// この関数はPlayFabSettings.staticPlayerのログイン状況を確認できる。
PlayFabClientAPI.IsClientLoggedIn();
```

PlayFabでは多くの場合、このstaticPlayerが使われます。

## ○○RequestにはAuthenticationContextを指定できる

PlayFabでは○○Requestを使うことが多いですが、実はAuthenticationContextを指定できます。

○○Requestの定義を見てみましょう。

```cs

// PlayFabにおける○○Requestは全て、PlayFabRequestCommonを継承している
public class PlayFabRequestCommon : PlayFabBaseModel
{
	public PlayFabAuthenticationContext AuthenticationContext;
}

// 例えば、GetLeaderboardAroundPlayerRequest もPlayFabRequestCommonを継承している
[Serializable]
public class GetLeaderboardAroundPlayerRequest : PlayFabRequestCommon
{
	// 省略
}
```

もし、○○RequestにAuthenticationContextを指定しなかった場合は、代わりにPlayFabSettings.staticPlayerが使用されます。

基本的にはAuthenticationContextを指定する必要はなさそうです。

## おわりに

まだPlayFabに関して勉強不足なので、AuthenticationContextの有効な使い方は「IDの確認」と「ログイン状況の確認」くらいしか分からなかったです。

ただ、調べているといくつかAuthenticationContextを使用したAPIを見つけたので、またの機会に調べようかと思います。

## 参考

-   [c# ServerInstanceAPI: what is the purpose of authenticationContext?](https://community.playfab.com/questions/36560/c-serverinstanceapi-what-is-the-purpose-of-authent.html)
