---
title: "【PlayFab】プレイヤー名（DisplayName）を登録・更新【Unity】"
description: "この記事でのバージョン PlayFab SDK: 2.86.2005 18 はじめに 前提条件としてプレイヤーがログインしている必要があるので、ログインについて知りたい方は以下の記事を見てもらえると幸いです。 【Play … 【PlayFab】プレイヤー名（DisplayName）を登録・更新【Unity】"
publishedAt: "2020-06-08T21:36:07+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】プレイヤー名（DisplayName）を登録・更新【Unity】 の記事画像"
---

この記事でのバージョン

-   PlayFab SDK: 2.86.2005 18

## はじめに

前提条件としてプレイヤーがログインしている必要があるので、ログインについて知りたい方は以下の記事を見てもらえると幸いです。

[【PlayFab】IDの生成、ログインについて【Unity】](/playfab-login/)

## プレイヤーの名前を登録・更新する

**プレイヤーがログインしたうえ**で、以下のようにUpdateUserTitleDisplayNameを呼び出すことでプレイヤーの名前の登録・更新を行うことができます。

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

PlayFabの管理画面でプレイヤーを確認すると、登録したDisplayNameが表示されているのが分かります。

![](./コメント-2020-06-08-211824.png)

## 一意でない名前（他のプレイヤー名と重複する）を許可する

PlayFabでは基本的に、プレイヤーの名前が重複することが許可されていません。重複する名前を登録しようとするとエラーが返ってきます。

ただしPlayFabの管理画面から、一意でない名前を許可することが可能です。

PlayFabの管理画面から「歯車アイコン -> Title settings」を開くと以下の画面が表示されると思うので、一意でない名前を許可したいときはチェックを入れてください。

![](./General-·-PlayFab-Google-Chrome-2020-06-08-21.06.04-2.png)

## 参考

-   [Account Management – Update User Title Display Name](https://docs.microsoft.com/en-us/rest/api/playfab/client/account-management/updateusertitledisplayname?view=playfab-rest)

## おわりに

DisplayNameの登録自体はかなり簡単で、ログイン後にAPIを1回呼ぶだけで済みます。

ゲーム内でプレイヤー名を表示したいなら、早めに入れておくと扱いやすいです。
