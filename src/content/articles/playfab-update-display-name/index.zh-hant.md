---
title: "【PlayFab】註冊與更新玩家名稱（DisplayName）【Unity】"
description: "本文使用版本 PlayFab SDK: 2.86.2005 18 前言 由於前提是玩家必須已經登入，如果你想先了解登入流程，歡迎先閱讀下方文章。 【PlayFab】註冊與更新玩家名稱（DisplayName）【Unity】"
publishedAt: "2020-06-08T21:36:07+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】註冊與更新玩家名稱（DisplayName）【Unity】的文章圖片"
---

本文使用的版本

-   PlayFab SDK: 2.86.2005 18

## 前言

前提是玩家必須已經登入，所以如果你想先了解登入流程，歡迎先閱讀下面這篇文章。

[【PlayFab】關於 ID 的生成與登入【Unity】](/articles/playfab-login/)

## 註冊與更新玩家名稱

在 **玩家已登入** 的前提下，只要像下面這樣呼叫 UpdateUserTitleDisplayName，就可以註冊或更新玩家名稱。

```cs

using UnityEngine;
using PlayFab;
using PlayFab.ClientModels;

public void SetPlayerDisplayName (string displayName) {
	PlayFabClientAPI.UpdateUserTitleDisplayName(
		new UpdateUserTitleDisplayNameRequest {
			DisplayName = displayName
		},
		result => {
			Debug.Log("Set display name was succeeded.);
		},
		error => {
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}
```

在 PlayFab 的管理後台查看玩家資料時，可以看到已註冊的 DisplayName 會顯示在那裡。

![](./コメント-2020-06-08-211824.png)

## 允許非唯一名稱（與其他玩家名稱重複）

在 PlayFab 中，基本上不允許玩家名稱重複。如果你嘗試註冊重複的名稱，就會收到錯誤。

不過，也可以從 PlayFab 的管理後台允許非唯一名稱。

從 PlayFab 管理後台開啟「齒輪圖示 -> Title settings」後，應該會看到下方畫面；如果你想允許非唯一名稱，請把選項勾起來。

![](./General-·-PlayFab-Google-Chrome-2020-06-08-21.06.04-2.png)

## 參考資料

-   [Account Management – Update User Title Display Name](https://docs.microsoft.com/en-us/rest/api/playfab/client/account-management/updateusertitledisplayname?view=playfab-rest)

## 結語

註冊 DisplayName 這件事本身非常簡單，登入後只要呼叫一次 API 就可以完成。

如果你打算在遊戲內顯示玩家名稱，越早接上會越好處理。
