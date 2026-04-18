---
title: "【PlayFab】ID 생성과 로그인【Unity】"
description: "이 글에서는 PlayFab SDK 2.86.2005 18을 사용한다. PlayFab에는 여러 기능이 있지만, 그것들을 사용하기 전에 가장 먼저 해야 할 일은 로그인이다. 이 글에서는 익명 로그인과 계정 복구가 가능한 로그인 방법을 설명한다."
publishedAt: "2020-05-25T20:54:14+09:00"
updatedAt: "2020-05-29T03:27:12+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】ID 생성과 로그인【Unity】의 글 이미지"
---

이 글에서 사용한 버전

-   PlayFab SDK: 2.86.2005 18

## 시작하며

PlayFab에는 여러 기능이 있지만, 그것들을 사용하기 전에 가장 먼저 해야 할 일은 로그인이다.

## "익명 로그인"과 "계정 복구가 가능한 로그인"이 있다

PlayFab의 로그인 방식은 크게 두 가지로 나눌 수 있다.

### 익명 로그인

가장 간단한 로그인 방식이다.

사용자가 별도의 정보를 입력할 필요가 없으므로, 게임이 자동으로 로그인 처리를 할 수 있다.

따라서 **"로그인이 너무 귀찮아서 그냥 그만두자"** 같은 상황이 생기지 않는다. 중요하다.

다만 플레이어가 기기를 잃어버리면 복구가 어렵다.

#### 익명 로그인 함수

-   [LoginWithIOSDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithiosdeviceid)
-   [LoginWithAndroidDeviceID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithandroiddeviceid)
-   [LoginWithCustomID](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithcustomid)

#### 익명 로그인 구현 예시

```cs

using UnityEngine;
using PlayFab;
using PlayFab.ClientModels;

// LoginWithCustomID를 사용한 구현 예시
public void Login (string id) {
	bool shouldCreateAccount = string.IsNullOrEmpty(id);

	PlayFabClientAPI.LoginWithCustomID(
		new LoginWithCustomIDRequest {
			CustomId = shouldCreateAccount ? CreateNewId() : id,
			CreateAccount = shouldCreateAccount
		},
		result => {
			// 성공 시 처리
			Debug.Log("Login successfully");
		},
		error => {
			// 실패 시 처리
			Debug.LogError(error.GenerateErrorReport());
		}
	);
}

// 고유 ID 생성
string CreateNewId () {
	return System.Guid.NewGuid().ToString();
}
```

### 계정 복구가 가능한 로그인 방법

기기에 문제가 생겼을 때 계정을 복구할 수 있게 해 주는 로그인 방식이다.

다만 플레이어에게 다음과 같은 입력을 요구해야 한다.

-   Facebook, iOS, Google 등 외부 제공자를 통한 인증
-   사용자 이름 또는 이메일 주소와 비밀번호 입력

따라서 게임 설치 직후 이런 로그인 방식을 바로 요구하면 **"로그인이 너무 귀찮아서 그냥 그만두자"**는 반응이 나올 수 있다. 도입 시점에 주의하자.

익명 로그인과 함께 사용하면, 처음에는 익명으로 시작한 뒤 나중에 계정 복구가 가능한 로그인 방식을 추가하도록 유도할 수 있다. (참조: [계정 연결 빠른 시작](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/quickstart))

#### 계정 복구가 가능한 로그인 함수

-   [LoginWithPlayFab](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithplayfab)
-   [LoginWithEmailAddress](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithemailaddress)

또한 다음 방법으로 서드파티 서비스를 통해 로그인할 수도 있다.

-   [LoginWithKongregate](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithkongregate)
-   [LoginWithSteam](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithsteam)
-   [LoginWithTwitch](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithtwitch)
-   [LoginWithFacebook](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithfacebook) (별도 SDK 필요)
-   [LoginWithGoogleAccount](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithgoogleaccount) (별도 SDK 필요)
-   [LoginWithWindowsHello](https://docs.microsoft.com/ja-jp/rest/api/playfab/client/authentication/loginwithwindowshello) (별도 SDK 필요)

## 마치며

현재 나는 PlayFab을 프로젝트에 도입하는 과정에 있으며, 아직 배우는 중이다.

혹시 틀린 부분이 있다면 알려주면 고맙겠다.

## 참고 자료

-   [로그인의 기본 개념과 모범 사례](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/login-basics-best-practices)
-   [플레이어 로그인](https://docs.microsoft.com/ja-jp/gaming/playfab/features/authentication/login/)
-   [Unity에서 PlayFab 도입, 로그인 흐름, 사용자별 커스텀 ID 생성](https://kan-kikuchi.hatenablog.com/entry/PlayFabLogin)
