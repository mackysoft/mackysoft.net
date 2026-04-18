---
title: "【PlayFab】PlayFabAuthenticationContext란?【Unity】"
description: "PlayFab을 사용하다 보면 여러 Request에 붙어 있는 PlayFabAuthenticationContext가 무엇인지 궁금해질 때가 있다. 이 글에서는 그 개념과 실제로 무엇에 쓰이는지 정리한다."
publishedAt: "2020-05-27T20:00:00+09:00"
updatedAt: "2020-06-10T21:03:11+09:00"
tags:
  - "playfab"
  - "unity"
cover: "./cover.png"
coverAlt: "【PlayFab】PlayFabAuthenticationContext란?【Unity】의 글 이미지"
---

## 시작하며

PlayFab을 사용하다 보면 여러 Request에 붙어 있는 `PlayFabAuthenticationContext`가 무엇인지 궁금해질 때가 있어서 직접 살펴보았다.

`PlayFabAuthenticationContext`는 이름이 길기 때문에, 이하에서는 AuthenticationContext라고 부르겠다.

## AuthenticationContext란?

AuthenticationContext를 직역하면 “인증의 문맥” 정도가 된다. 바로 와닿는 표현은 아니다.

“인증의 문맥”이 무엇을 뜻하는지 이해하기 위해, `PlayFabAuthenticationContext`에 정의된 몇 가지 멤버와 메서드를 살펴보자.

### string PlayFabId

플레이어를 식별하는 데 사용하는 ID다.

예를 들어, 리더보드에서 자기 항목만 강조 표시하고 싶을 때 사용할 수 있다.

```cs

using UnityEngine;
using UnityEngine.UI;
using PlayFab;
using PlayFab.ClientModels;

// 리더보드 항목용 UI
public class LeaderboardEntryUI : MonoBehaviour {

	// 항목을 강조 표시할 UI
	public Image focusImage;

	public void SetEntry (PlayerLeaderboardEntry entry) {
		// 리더보드 항목의 PlayFabId와 현재 플레이어의 PlayFabId가 같으면 UI를 강조 표시한다
		focusImage.enabled = (entry.PlayFabId == PlayFabSettings.staticPlayer.PlayFabId);
	}
}
```

### bool IsClientLoggedIn ()

플레이어가 로그인되어 있는지 여부를 반환하는 메서드다.

```cs

using PlayFab;

// 컨텍스트가 로그인 상태인지 확인
public bool IsClientLoggedIn (PlayFabAuthenticationContext context) {
	return context.IsClientLoggedIn();
}
```

이 두 멤버만 봐도 “인증의 문맥”이 어떤 의미인지 대략 감이 온다.

## 현재 플레이어를 가져오는 방법

다음과 같이 현재 플레이어, 즉 `staticPlayer`를 가져올 수 있다.

```cs

using PlayFab;

// 현재 플레이어를 가져온다
PlayFabAuthenticationContext player = PlayFabSettings.staticPlayer;

// 이 메서드는 PlayFabSettings.staticPlayer의 로그인 상태를 확인할 수 있다.
PlayFabClientAPI.IsClientLoggedIn();
```

PlayFab에서는 많은 경우 이 `staticPlayer`가 사용된다.

## Request에는 AuthenticationContext를 지정할 수 있다

PlayFab에서는 Request 객체를 자주 사용하며, AuthenticationContext도 여기에 지정할 수 있다.

Request 정의를 한 번 살펴보자.

```cs

// PlayFab에서는 모든 request 타입이 PlayFabRequestCommon을 상속한다
public class PlayFabRequestCommon : PlayFabBaseModel
{
	public PlayFabAuthenticationContext AuthenticationContext;
}

// 예를 들어 GetLeaderboardAroundPlayerRequest도 PlayFabRequestCommon을 상속한다
[Serializable]
public class GetLeaderboardAroundPlayerRequest : PlayFabRequestCommon
{
	// omitted
}
```

Request 객체에 AuthenticationContext를 지정하지 않으면 대신 `PlayFabSettings.staticPlayer`가 사용된다.

대부분의 경우 AuthenticationContext를 따로 지정할 필요는 없다.

## 마치며

아직 PlayFab을 충분히 깊게 이해한 상태는 아니라서, 지금 시점에서 AuthenticationContext의 주된 용도는 플레이어 ID와 로그인 상태를 확인하는 정도라고 볼 수 있었다.

다만 조사하는 과정에서 AuthenticationContext를 사용하는 몇몇 API도 찾았으니, 다음에 기회가 되면 더 살펴볼 생각이다.

## 참고 자료

-   [C# ServerInstanceAPI: what is the purpose of authenticationContext?](https://community.playfab.com/questions/36560/c-serverinstanceapi-what-is-the-purpose-of-authent.html)
