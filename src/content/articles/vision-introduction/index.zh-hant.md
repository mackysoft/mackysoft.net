---
title: "【Unity】更輕鬆地實作 CullingGroup【Vision】"
description: "什麼是 CullingGroup API？它適合用在依物件是否可見，或與玩家距離多遠來切換處理的情況。例如，可以將鏡頭外的物件設為非啟用、略過遠方角色的 AI，或避免敵人在生成點出現在鏡頭中時生成。"
publishedAt: "2021-03-16T00:00:00+09:00"
updatedAt: "2021-03-17T02:16:32+09:00"
tags:
  - "asset"
  - "unity"
  - "vision"
  - "cullinggroup"
  - "lod"
  - "tutorial"
cover: "./cover.gif"
coverAlt: "【Unity】更輕鬆地實作 CullingGroup【Vision】 的文章圖片"
---

## 什麼是 CullingGroup API？

當你想根據「物件是否可見」或「物件距離玩家有多遠」來切換處理時，就可以使用它。

例如：

-   將鏡頭中看不見的物件設為非啟用。
-   略過距離很遠的角色 AI 處理。
-   當敵人的生成點出現在鏡頭中時，不要生成敵人。

[Unity Manual](https://docs.unity3d.com/Manual/CullingGroupAPI.html)

## Vision 是什麼？

CullingGroup 是很棒的功能，但它只能從腳本存取，而且使用方式也稍微有些難度，因此不太像是能「快速上手，超方便！」地直接使用的東西。

[Vision](https://github.com/mackysoft/Vision) 是一套讓任何人都能輕鬆使用 CullingGroup 的函式庫。

#### Vision 的特點

-   能輕鬆存取 CullingGroup 的元件群
-   直覺的視覺化編輯器
-   高效能

以下影片示範的是 Vision 所提供的其中一個功能範例：將鏡頭中看不見的物件設為非啟用。

![](./cover.gif)

這個功能不需要寫程式碼也能實作。

## 安裝

你可以從 GitHub 儲存庫下載 Vision 的最新版本。

Releases: [https://github.com/mackysoft/Vision/releases](https://github.com/mackysoft/Vision/releases)

## 使用方式

### 1. 建立 Culling Group Proxy

首先，建立作為 Vision 基礎的 `CullingGroupProxy`。

#### 選擇「Tools/Vision/Create New CullingGroupProxy」選單

會建立出如下所示的 GameObject。

![](./111070665-0c798f80-8516-11eb-8ed6-d1f87cc31b61.jpg)

#### 為建立好的 CullingGroupProxy 指定 Key

一開始會顯示「尚未設定 Key」的錯誤訊息，所以請先指定 Key。

在預設狀態下，可以使用 `Main` 這個 Key。

### 2. 新增 Culling Target Behaviour

#### 從「Component/MackySoft/Vision/Culling Target Behaviour」選單新增

請將 CullingTargetBehaviour 掛在下列這類物件上：

-   想在鏡頭看不見時設為非啟用的物件
-   想在遠離玩家時停止執行 AI 的角色

![](./111072032-333ac480-851c-11eb-8821-0b4f766e1e34.jpg)

#### 調整球體半徑

掛上 CullingTargetBehaviour 的物件會顯示如下的球體（Bounding Sphere）。

![](./111072309-57e36c00-851d-11eb-8196-8c38b2af62c1.jpg)

這個球體是用來計算「是否能被鏡頭看見」以及「距離玩家有多遠」所必需的。

因此，請將球體調整為能完整包住物件。

如下圖所示，球體會依據是否能被鏡頭看見而改變顏色。

![](./111074733-bf061e00-8527-11eb-8e19-e6796e56c63a.jpg)

![](./111074737-c6c5c280-8527-11eb-9275-220103d8d59a.jpg)

#### 設定 Key

CullingTargetBehaviour 的 GroupKey 用來尋找設定了相同 Key 的 CullingGroupProxy。當 CullingTargetBehaviour 啟動時，會註冊到具有相同 Key 的 CullingGroupProxy。

#### 設定 Bounding Sphere Update Mode

這個值對效能很重要。

BoundingSphereUpdateMode 預設設為 Dynamic，也就是每一幀都會更新球體的位置與半徑。

但有些物件不會移動。這種情況下，將 BoundingSphereUpdateMode 設為 Static，就能避免多餘的更新成本。

### 3. 接收回呼

若要接收球體的「可視狀態」與「相對距離狀態」發生變化的通知，可以使用 CullingTargetBehaviour.OnStateChanged。

（如果你心想「這不還是得寫程式嗎！」，也有不需要寫程式的通用元件可用）

```cs

using UnityEngine;
using MackySoft.Vision;

[RequireComponent(typeof(CullingTargetBehaviour))]
public class ReceiveCallbackExample : MonoBehaviour {

    void Awake () {
        var cullingTarget = GetComponent();
        cullingTarget.OnStateChanged += OnStateChanged;
    }

    void OnStaeteChanged (CullingGroupEvent ev) {
        if (ev.isVisible) {
            Debug.Log("Visible!");
        } else {
            Debug.Log("Invisible!");
        }
    }
}
```

## 通用元件

#### Culling Target Renderers

這個元件會依據球體的可視狀態，切換已註冊 Renderer 的啟用與停用。

文章開頭影片中的功能，就是用這個元件實作的。

![](./111073973-5cf7e980-8524-11eb-9b84-ab95c263940c.jpg)

## 結語

這套工具已實際用在開發中，易用性、效能與實機上的行為都已經確認過。

GitHub: [https://github.com/mackysoft/Vision](https://github.com/mackysoft/Vision)

[![](./Vision_Logo_Frame_Gray.png)](https://github.com/mackysoft/Vision)
