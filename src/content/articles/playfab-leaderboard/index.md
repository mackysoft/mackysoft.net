---
title: "【PlayFab】Leaderboardを使ってランキングを実装する【Unity】"
description: "この記事でのバージョン PlayFab SDK: 2.86.2005 18 はじめに この記事では、PlayFabのLeaderboard関連のAPIを使用しています。前提条件としてプレイヤーがログインしている必要がある … 【PlayFab】Leaderboardを使ってランキングを実装する【Unity】"
publishedAt: "2020-05-26T21:56:13+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
draft: true
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】Leaderboardを使ってランキングを実装する【Unity】 の記事画像"
---

この記事でのバージョン

-   PlayFab SDK: 2.86.2005 18

## はじめに

この記事では、PlayFabのLeaderboard関連のAPIを使用しています。前提条件としてプレイヤーがログインしている必要があるので、ログインについて知りたい方は以下の記事を見てもらえると幸いです。

[【PlayFab】IDの生成、ログインについて【Unity】](/playfab-login/)

## リーダーボードの作成

リーダーボードの実装にはまず、[PlayFabの管理画面](https://developer.playfab.com/en-US/my-games)から新しいリーダーボードを作成する必要があります。

#### １．リーダーボード管理画面を開く

![](./bandicam-2020-05-26-18-03-43-613.png)

#### ２．画面右上の「NEW LEADERBOARD」ボタンを押す

![](./bandicam-2020-05-26-18-09-58-019.png)

#### ３．リーダーボードの作成

![](./New-Leaderboard-·-PlayFab-Google-Chrome-2020-05-26-18.24.12-1.png)

#### Reset frequency

リセット頻度には大きく分けて「マニュアル」と「期間指定」2種類の方法がありますが、「マニュアル」ではリーダーボードの管理画面から直接リセットを行います。

![](./Steps-·-PlayFab-Google-Chrome-2020-05-26-20.43.43.png)

なお、「期間指定」の場合でもこちらから直接リセットを行えます。

#### Aggregation method

プレイヤーがリーダーボードに送信した値をどのように集計するかを決定します。

| 集計方法 | 説明 |
| --- | --- |
| Last | プレイヤーが送信した最後の値を使用します。 |
| Minimum | 最低値を使用します。最低値を競うランキングに使う。 |
| Maximum | 最高値を使用します。最高値を競うランキングに使う。 |
| Sum | プレイヤーが送信した値を既存の値に加算します。合計値を競うランキングに使う。 |

## スクリプティング

ここからはLeaderboardのAPIについて解説します。

### プレイヤーの名前を登録する

リーダーボードに表示するためのプレイヤー名を設定します。

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

### リーダーボードにスコアを送信する

プレイヤーのスコアを送信する前にまず、PlayFabの管理画面からプレイヤー統計の送信許可をする必要があります。

「歯車アイコン -> Title settings」から「API Features」を選択して「Allow client to post player statistics」にチェックをいれます。

![](./API-Features-·-PlayFab-Google-Chrome-2020-05-26-21.16.08.png)

以下のコードは、リーダーボードにプレイヤーのスコアを送信するサンプルです。

```cs

using UnityEngine;
using PlayFab;
using PlayFab.ClientModels;

public void SendStatisticUpdate (string leaderboardName,int score) {
	// 送信したい更新情報
	var statisticUpdates = new List<StatisticUpdate> {
		new StatisticUpdate {
			StatisticName = leaderboardName,
			Value = score
		}
	};

	PlayFabClientAPI.UpdatePlayerStatistics(
		new UpdatePlayerStatisticsRequest {
			Statistics = statisticUpdates
		},
		result => {
			Debug.Log("Send score was succeeded.");
		},
		error => {
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}
```

leaderboardNameには、先ほどリーダーボードを作成したときに決めた名前（Statistic name）を指定します。

### リーダーボードを取得する

以下のコードはリーダーボードを取得するサンプルです。

```cs

using UnityEngine;
using PlayFab;
using PlayFab.ClientModels;

public void LoadLeaderboardWithStartAtSpecifiedPosition (string leaderboardName,int startPosition,int maxResultsCount) {
	PlayFabClientAPI.GetLeaderboard(
		new GetLeaderboardRequest {
			StatisticName = leaderboardName,
			StartPosition = startPosition,
			MaxResultsCount = maxResultsCount
		},
		result => {
			// リーダーボードの結果をログに表示する
			foreach (PlayerLeaderboardEntry entry in result.Leaderboard) {
				Debug.Log($"{entry.DisplayName}: {entry.StatValue}");
			}
		},
		error => {
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}
```

#### GetLeaderboardの種類

リーダーボードの取得にはいくつかの種類があります。

| GetLeaderboardの種類 | 説明 |
| --- | --- |
| [GetLeaderboard](https://docs.microsoft.com/en-us/rest/api/playfab/client/player-data-management/getleaderboard?view=playfab-rest) | リーダーボードの指定した位置から、指定された数のユーザーのリストを取得。
（フレンド限定のGetFriendLeaderboardもある） |
| [GetLeaderboardAround Player](https://docs.microsoft.com/en-us/rest/api/playfab/client/player-data-management/getleaderboardaroundplayer?view=playfab-rest) | ログイン中のプレイヤー（または指定されたプレイヤー）を中心としたランク付けされたユーザーのリスト（フレンド限定のGetFriendLeaderboardAroundPlayerもある） |

## おわりに

PlayFabに関して、筆者は現時点でプロジェクトに導入途中（勉強中）の段階です。

もし誤りがあれば教えてもらえると幸いです。

## 参考

-   [高度なスコアボードのプロファイルの使用](https://docs.microsoft.com/ja-jp/gaming/playfab/features/social/tournaments-leaderboards/using-the-profile-for-advanced-leaderboards)
-   [Azure PlayFabのとても便利なランキング機能を使ってみた&ついでにランキング報酬も配ってみた](https://qiita.com/_y_minami/items/9143502f465ad11ff2ca)
