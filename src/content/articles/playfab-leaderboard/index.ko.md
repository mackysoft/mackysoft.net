---
title: "【PlayFab】리더보드로 랭킹 구현하기【Unity】"
description: "이 글에서는 PlayFab의 리더보드 관련 API를 사용한다. 플레이어가 먼저 로그인되어 있어야 하므로, 로그인 방법이 궁금하다면 아래 글을 참고하자."
publishedAt: "2020-05-26T21:56:13+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】리더보드로 랭킹 구현하기【Unity】의 글 이미지"
---

이 글에서 사용한 버전

-   PlayFab SDK: 2.86.2005 18

## 시작하며

이 글에서는 PlayFab의 리더보드 관련 API를 사용한다. 플레이어가 먼저 로그인되어 있어야 하므로, 로그인 방법이 궁금하다면 아래 글을 참고하자.

[【PlayFab】ID 생성과 로그인【Unity】](/articles/playfab-login/)

## 리더보드 만들기

리더보드를 구현하려면 먼저 PlayFab 대시보드에서 리더보드를 만들어야 한다.

#### 1. 리더보드 관리 화면 열기

![](./bandicam-2020-05-26-18-03-43-613.png)

#### 2. 오른쪽 위의 "NEW LEADERBOARD" 버튼 클릭

![](./bandicam-2020-05-26-18-09-58-019.png)

#### 3. 리더보드 생성

![](./New-Leaderboard-·-PlayFab-Google-Chrome-2020-05-26-18.24.12-1.png)

#### 리셋 주기

리셋 주기는 크게 수동과 예약의 두 가지 방식이 있다. 수동 모드에서는 리더보드 관리 화면에서 직접 리더보드를 초기화한다.

![](./Steps-·-PlayFab-Google-Chrome-2020-05-26-20.43.43.png)

예약 리셋을 선택해도 여기에서 직접 수동으로 초기화할 수 있다.

#### 집계 방식

리더보드로 전송된 값을 어떻게 집계할지 결정한다.

| 집계 방식 | 설명 |
| --- | --- |
| Last | 플레이어가 마지막으로 제출한 값을 사용한다. |
| Minimum | 가장 낮은 값을 사용한다. 낮은 점수를 겨루는 순위에 적합하다. |
| Maximum | 가장 높은 값을 사용한다. 높은 점수를 겨루는 순위에 적합하다. |
| Sum | 플레이어가 제출한 값을 기존 값에 더한다. 누적 합계를 겨루는 순위에 적합하다. |

## 스크립팅

이제 리더보드 API를 설명하겠다.

### 플레이어 이름 등록

리더보드에 표시할 플레이어 이름을 설정한다.

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
			Debug.Log("Display name was set successfully.");
		},
		error => {
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}
```

### 리더보드에 점수 전송

플레이어의 점수를 전송하기 전에 먼저 PlayFab 대시보드에서 플레이어 통계 전송을 허용해야 한다.

톱니바퀴 아이콘 -> Title settings에서 API Features를 연 뒤 `Allow client to post player statistics`에 체크한다.

![](./API-Features-·-PlayFab-Google-Chrome-2020-05-26-21.16.08.png)

아래 코드는 플레이어 점수를 리더보드에 전송하는 예시다.

```cs

using System.Collections.Generic;
using UnityEngine;
using PlayFab;
using PlayFab.ClientModels;

public void SendStatisticUpdate (string leaderboardName,int score) {
	// 전송할 업데이트 정보
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
			Debug.Log("Score was submitted successfully.");
		},
		error => {
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}
```

`leaderboardName`에는 앞서 리더보드를 만들 때 정한 이름, 즉 `Statistic name`을 지정한다.

### 리더보드 가져오기

아래 코드는 리더보드를 가져오는 예시다.

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
			// 리더보드 결과를 로그에 표시한다
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

#### GetLeaderboard의 종류

리더보드 데이터를 가져오는 방법은 여러 가지가 있다.

| 리더보드 종류 | 설명 |
| --- | --- |
| [GetLeaderboard](https://docs.microsoft.com/en-us/rest/api/playfab/client/player-data-management/getleaderboard?view=playfab-rest) | 지정한 위치부터 시작해, 지정한 수만큼 사용자의 목록을 가져온다. (친구만 대상으로 하는 GetFriendLeaderboard도 있다.) |
| [GetLeaderboardAroundPlayer](https://docs.microsoft.com/en-us/rest/api/playfab/client/player-data-management/getleaderboardaroundplayer?view=playfab-rest) | 현재 로그인한 플레이어 또는 지정한 플레이어를 중심으로 순위 목록을 가져온다. (친구만 대상으로 하는 GetFriendLeaderboardAroundPlayer도 있다.) |

## 마치며

나는 아직 PlayFab을 프로젝트에 도입하는 중이라 계속 배우고 있다.

혹시 잘못된 부분을 발견하면 알려주면 고맙겠다.

## 참고 자료

-   [Using the Profile for Advanced Scoreboards](https://docs.microsoft.com/ja-jp/gaming/playfab/features/social/tournaments-leaderboards/using-the-profile-for-advanced-leaderboards)
-   [I tried PlayFab's convenient leaderboard feature and even handed out ranking rewards](https://qiita.com/_y_minami/items/9143502f465ad11ff2ca)
