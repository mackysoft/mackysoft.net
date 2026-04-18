---
title: "【PlayFab】關於 ID 的生成與登入【Unity】"
description: "本文使用版本 PlayFab SDK: 2.86.2005 18 前言 PlayFab 有許多功能，但要使用它們，第一步就是登入。本文會說明「匿名登入」與「可恢復的登入」兩種方式。 【PlayFab】關於 ID 的生成與登入【Unity】"
publishedAt: "2020-05-25T20:54:14+09:00"
updatedAt: "2020-05-29T03:27:12+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】關於 ID 的生成與登入【Unity】的文章圖片"
---

本文使用的版本

-   PlayFab SDK: 2.86.2005 18

## 前言

PlayFab 有許多功能，但要使用它們，第一步就是登入。

## 有「匿名登入」與「可恢復的登入」

PlayFab 的登入方式大致可以分成兩種。

### 匿名登入

這是最簡單的登入方式。

因為使用者不需要輸入任何資訊，所以遊戲可以自動完成登入處理。

因此就不會發生 **「登入太麻煩了，還是算了」** 這種事。（很重要）

不過，如果玩家遺失裝置，帳號就很難恢復。

#### 進行匿名登入的函式

-   [LoginWithIOSDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithiosdeviceid)
-   [LoginWithAndroidDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithandroiddeviceid)
-   [LoginWithCustomID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithcustomid)

#### 匿名登入的實作範例

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

### 可恢復的登入

這是一種在裝置發生問題等情況時，仍能恢復帳號的登入方式。

但這種方式需要玩家輸入像下面這些資訊。

-   透過外部提供者（Facebook、iOS、Google 等）進行驗證
-   輸入使用者名稱或電子郵件地址，以及密碼

因此，如果在安裝遊戲後立刻要求玩家採用這種登入方式，就很可能發生 **「登入太麻煩了，還是算了」**。使用時要特別注意。

另外，如果和匿名登入搭配使用，就可以做到「一開始先以匿名登入開始，之後再引導玩家追加可恢復的登入方式」。（參考：[帳號連結快速入門](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/quickstart)）

#### 進行可恢復登入的函式

-   [LoginWithPlayFab](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithplayfab)
-   [LoginWithEmailAddress](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithemailaddress)

以下這些方法則可以透過第三方服務登入。

-   [LoginWithKongregate](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithkongregate)
-   [LoginWithSteam](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithsteam)
-   [LoginWithTwitch](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithtwitch)
-   [LoginWithFacebook](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithfacebook)（需要另外的 SDK）
-   [LoginWithGoogleAccount](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithgoogleaccount)（需要另外的 SDK）
-   [LoginWithWindowsHello](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithwindowshello)（需要另外的 SDK）

## 結語

關於 PlayFab，我目前仍處於導入專案、邊做邊學的階段。

如果有任何錯誤，也歡迎告訴我。

## 參考資料

-   [登入的基本概念與最佳做法](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/login-basics-best-practices)
-   [玩家登入](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/)
-   [在 Unity 導入 PlayFab、登入流程，以及為每位使用者生成自訂 ID](https://kan-kikuchi.hatenablog.com/entry/PlayFabLogin)
