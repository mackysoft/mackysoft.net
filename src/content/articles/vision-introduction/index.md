---
title: "【Unity】CullingGroupをより簡単に実装する【Vision】"
description: "CullingGroup APIとは？ 「オブジェクトが見えているかどうか」「オブジェクトがプレイヤーからどれくらい離れているか」で処理を切り替えたい時などに使えます。 例えば、 カメラに表示されていないオブジェクトを非 … 【Unity】CullingGroupをより簡単に実装する【Vision】"
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
coverAlt: "【Unity】CullingGroupをより簡単に実装する【Vision】 の記事画像"
---

## CullingGroup APIとは？

「オブジェクトが見えているかどうか」「オブジェクトがプレイヤーからどれくらい離れているか」で処理を切り替えたい時などに使えます。

例えば、

-   カメラに表示されていないオブジェクトを非アクティブにする。
-   遠くにいるキャラクターのAIをスキップする。
-   敵のスポーンポイントがカメラに映っているときは敵がスポーンしないようにする。

などが挙げられます。

Unity Manual：[](https://docs.unity3d.com/Manual/CullingGroupAPI.html)[https://docs.unity3d.com/Manual/CullingGroupAPI.html](https://docs.unity3d.com/Manual/CullingGroupAPI.html)

## Visionとは？

CullingGroupは素晴らしい機能ですが、スクリプトからしかアクセス出来ず、その使用方法も少し難しいので、「サクッと実装！超便利！」という風にはいきません。

[『Vision』](https://github.com/mackysoft/Vision)は、そんなCullingGroupを誰でも簡単に使えるようにしたライブラリです。

#### Visionの特徴

-   CullingGroupに簡単にアクセスするためのコンポーネント群
-   直感的なビジュアルエディタ
-   高パフォーマンス

以下の動画はVisionによる「カメラに表示されていないオブジェクトを非アクティブにする機能」の一例です。

![](./cover.gif)

この機能はコードを書かずに実装できます。

## インストール

GithubのリポジトリからVisionの最新バージョンをダウンロードできます。

Releases: [https://github.com/mackysoft/Vision/releases](https://github.com/mackysoft/Vision/releases)

## 使い方

### １．Culling Group Proxyを作成する

まずは、Visionの基礎となる`CullingGroupProxy`を作成します。

#### 「Tools/Vision/Create New CullingGroupProxy」メニューを選択する

以下のようなGameObjectが作成されます。

![](./111070665-0c798f80-8516-11eb-8ed6-d1f87cc31b61.jpg)

#### 作成したCullingGroupProxyにキーを設定する

そのままだと「キーが設定されてないよ」というエラーが表示されているので、キーを設定してあげます。

デフォルトの状態だと「Main」キーが使用可能です。

### ２．Culling Target Behaviourを追加する

#### 「Component/MackySoft/Vision/Culling Target Behaviour」メニューから追加する

CullingTargetBehaviourは、以下のようなオブジェクトにアタッチします。

-   カメラから見えていないときは非アクティブにしたいオブジェクト
-   プレイヤーから遠いときはAIの処理を行わないキャラクター

![](./111072032-333ac480-851c-11eb-8821-0b4f766e1e34.jpg)

#### 球体の半径を調整する

CullingTargetBehaviourをアタッチしたオブジェクトには、以下のように球体（Bounding Sphere）が表示されます。

![](./111072309-57e36c00-851d-11eb-8196-8c38b2af62c1.jpg)

この球体は「カメラから見えているか」「プレイヤーからどれくらい離れているか」の計算をする上で必要になってくるものです。

なので、この球体がオブジェクトを完全に囲うように設定してください。

以下の画像のように、「球体がカメラから見えるかどうか」で球体の色が変わるようになっています。

![](./111074733-bf061e00-8527-11eb-8e19-e6796e56c63a.jpg)

![](./111074737-c6c5c280-8527-11eb-9275-220103d8d59a.jpg)

#### キーを設定する

CullingTargetBehaviourのGroupKeyは、同じキーが設定されているCullingGroupProxyを見つけるためのものです。CullingTargetBehaviourが起動すると、同じキーが設定されているCullingGroupProxyに登録されます。

#### Bounding Sphere Update Modeを設定する

これはパフォーマンス上、重要な値です。

BoundingSphereUpdateModeは、デフォルトだとDynamicに設定されています。これは、球体の位置と半径がフレームごとに更新されることを意味します。

しかし、動かないものもあります。このような場合、BoundingSphereUpdateModeをStaticに設定することで、余計な更新コストを回避できます。

### ３．コールバックを受信する

球体の「可視性」と「相対距離の状態」が変化したことを受信するには、CullingTargetBehaviour.OnStateChangedを使用します。

（※「コード書く必要あるじゃん！」と思った方のために、コーディング不要な汎用的なコンポーネントも用意してあります）

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

## 汎用コンポーネント

#### Culling Target Renderers

球体の可視性に応じて、登録しているRendererの有効・無効を切り替えるコンポーネントです。

記事冒頭の動画の機能はこのコンポーネントで実装しています。

![](./111073973-5cf7e980-8524-11eb-9b84-ab95c263940c.jpg)

## おわりに

実際の開発で使っており、使いやすさ、パフォーマンス、実機での動作も確認済みです。

Github：[https://github.com/mackysoft/Vision](https://github.com/mackysoft/Vision)

[![](./Vision_Logo_Frame_Gray.png)](https://github.com/mackysoft/Vision)
