---
title: "【PlayFab】표시 이름(DisplayName) 등록 및 갱신【Unity】"
description: "이 글에서는 PlayFab에서 플레이어의 표시 이름을 등록하고 갱신하는 방법을 다룬다. 플레이어가 먼저 로그인되어 있어야 하므로, 로그인 방법이 궁금하다면 아래 글을 참고하자."
publishedAt: "2020-06-08T21:36:07+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】표시 이름(DisplayName) 등록 및 갱신【Unity】의 글 이미지"
---

이 글에서 사용한 버전

-   PlayFab SDK: 2.86.2005 18

## 시작하며

플레이어가 먼저 로그인되어 있어야 하므로, 로그인 방법이 궁금하다면 아래 글을 참고하자.

[【PlayFab】ID 생성과 로그인【Unity】](/articles/playfab-login/)

## 플레이어 표시 이름 등록 및 갱신

**플레이어가 로그인한 상태**라면, 아래처럼 `UpdateUserTitleDisplayName`을 호출해서 플레이어 이름을 등록하거나 갱신할 수 있다.

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

PlayFab 관리 화면에서 플레이어를 확인하면, 등록한 `DisplayName`이 표시되는 것을 볼 수 있다.

![](./コメント-2020-06-08-211824.png)

## 중복 이름 허용

PlayFab에서는 기본적으로 플레이어 이름의 중복이 허용되지 않는다. 중복된 이름을 등록하려고 하면 오류가 발생한다.

다만 PlayFab 관리 화면에서 중복 이름을 허용할 수 있다.

PlayFab 관리 화면에서 톱니바퀴 아이콘 -> Title settings를 열면 아래 화면이 보일 것이다. 중복 이름을 허용하려면 체크박스를 선택하면 된다.

![](./General-·-PlayFab-Google-Chrome-2020-06-08-21.06.04-2.png)

## 참고 자료

-   [Account Management – Update User Title Display Name](https://docs.microsoft.com/en-us/rest/api/playfab/client/account-management/updateusertitledisplayname?view=playfab-rest)

## 마치며

플레이어 이름 등록은 꽤 간단해서, 로그인 후 API를 한 번만 호출하면 된다.

게임 안에서 플레이어 이름을 표시할 계획이라면, 가능한 한 일찍 연결해 두는 편이 좋다.
