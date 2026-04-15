---
title: "【PlayFab】IDの生成、ログインについて【Unity】"
description: "この記事でのバージョン PlayFab SDK: 2.86.2005 18 はじめに PlayFabには様々な機能がありますが、それらの機能を使うため最初にすべきことはログインです。 「匿名ログイン」と「回復可能なログイ … 【PlayFab】IDの生成、ログインについて【Unity】"
publishedAt: "2020-05-25T20:54:14+09:00"
updatedAt: "2020-05-29T03:27:12+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】IDの生成、ログインについて【Unity】 の記事画像"
---

この記事でのバージョン

-   PlayFab SDK: 2.86.2005 18

## はじめに

PlayFabには様々な機能がありますが、それらの機能を使うため最初にすべきことはログインです。

## 「匿名ログイン」と「回復可能なログイン」がある

PlayFabには大きく分けて、2種類のログイン方法があります。

### 匿名ログイン

これが最も簡単なログイン方法です。

ユーザーが何かしらの情報を入力する必要がないですので、ゲームが自動でログイン処理を行えます。

そのため **「ログインめんどくさいからやっぱやーめた」** みたいなことが起きない。（重要）

ただしプレイヤーがデバイスを紛失したりしたら、回復は困難。

#### 匿名ログインを行う関数

-   [LoginWithIOSDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithiosdeviceid)
-   [LoginWithAndroidDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithandroiddeviceid)
-   [LoginWithCustomID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithcustomid)

#### 匿名ログイン実装例

```cs

using UnityEngine;
using PlayFab;
using PlayFab.ClientModels;

// LoginWithCustomIDを使った実装例
public void Login (string id) {
	bool shouldCreateAccount = string.IsNullOrEmpty(id);

	PlayFabClientAPI.LoginWithCustomID(
		new LoginWithCustomIDRequest {
			CustomId = shouldCreateAccount ? CreateNewId() : id,
			CreateAccount = shouldCreateAccount
		},
		result => {
			// 成功時の処理
			Debug.Log("Login successfully");
		},
		error => {
			// 失敗時の処理
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}

// 一意のIdを生成する
string CreateNewId () {
	return System.Guid.NewGuid().ToString();
}
```

### 回復可能なログイン

デバイスになにかしらの問題が起きたときなどに、アカウントを回復可能なログイン方法です。

ただし、プレイヤーに以下のような入力を要求する必要があります。

-   外部プロバイダー（Facebook、iOS、Googleなど）の認証を求める
-   ユーザー名かメールアドレスと、パスワードの入力を求める

そのため、ゲームをインストールしていきなりこのログインを要求すると、 **「ログインめんどくさいからやっぱやーめた」** が発生します。使う時は気を付けましょう。

なお、匿名ログインとペアリングすると「最初は匿名ログインで始めておいて、後から回復可能なログインを促す」みたいなことができます。（参照：[アカウントのリンクのクイックスタート](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/quickstart)）

#### 回復可能なログインを行う関数

-   [LoginWithPlayFab](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithplayfab)
-   [LoginWithEmailAddress](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithemailaddress)

以下の方法では、サードパーティを介してログインを行うことができます。

-   [LoginWithKongregate](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithkongregate)
-   [LoginWithS](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithsteam)[t](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithsteam)[eam](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithsteam)
-   [LoginWithTwitch](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithtwitch)
-   [LoginWithFacebook](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithfacebook)（別個SDKが必要）
-   [LoginWithGoogleAccount](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithgoogleaccount)（別個SDKが必要）
-   [LoginWithWindowsHello](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithwindowshello)（別個SDKが必要）

## おわりに

PlayFabに関して、筆者は現時点でプロジェクトに導入途中（勉強中）の段階です。

もし誤りがあれば教えてもらえると幸いです。

## 参考

-   [ログインの基本とベストプラクティス](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/login-basics-best-practices)
-   [プレイヤーのログイン](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/)
-   [](https://kan-kikuchi.hatenablog.com/entry/PlayFabLogin)[UnityでのPlayFabの導入とログイン処理とユーザごとのカスタムID生成](https://kan-kikuchi.hatenablog.com/entry/PlayFabLogin)

