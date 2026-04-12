---
title: "[Unity] Implementing CullingGroup More Easily [Vision]"
description: "What is the CullingGroup API? It is useful when you want to switch behavior based on whether an object is visible or how far it is from the player. For example, you can deactivate objects that are not on screen, skip distant character AI, or prevent enemies from spawning while a spawn point is visible to the camera."
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
coverAlt: "Article image for [Unity] Implementing CullingGroup More Easily [Vision]"
---

## What is the CullingGroup API?

It is useful when you want to switch behavior based on whether an object is visible or how far it is from the player.

For example:

-   Deactivate objects that are not visible to the camera.
-   Skip AI processing for characters that are far away.
-   Prevent enemies from spawning while a spawn point is visible to the camera.

[Unity Manual](https://docs.unity3d.com/Manual/CullingGroupAPI.html)

## What is Vision?

CullingGroup is a great feature, but it can only be accessed from scripts and the usage is a little tricky, so it is not something you can just drop in and use right away.

[Vision](https://github.com/mackysoft/Vision) is a library that makes CullingGroup easy for anyone to use.

#### Vision features

-   Components that make it easy to access CullingGroup
-   An intuitive visual editor
-   High performance

The video below shows one example of using Vision to deactivate objects that are not visible to the camera.

![](./cover.gif)

You can implement this feature without writing code.

## Installation

You can download the latest version of Vision from the GitHub repository.

Releases: [https://github.com/mackysoft/Vision/releases](https://github.com/mackysoft/Vision/releases)

## Usage

### 1. Create a Culling Group Proxy

First, create the `CullingGroupProxy` that serves as the foundation of Vision.

#### Select the "Tools/Vision/Create New CullingGroupProxy" menu item

A GameObject like the one below will be created.

![](./111070665-0c798f80-8516-11eb-8ed6-d1f87cc31b61.jpg)

#### Assign a key to the created CullingGroupProxy

At first, an error saying that no key is assigned will appear, so assign a key.

By default, the "Main" key is available.

### 2. Add a Culling Target Behaviour

#### Add it from the "Component/MackySoft/Vision/Culling Target Behaviour" menu

Attach CullingTargetBehaviour to objects such as:

-   Objects you want to deactivate when they are not visible to the camera
-   Characters that should not run AI when they are far from the player

![](./111072032-333ac480-851c-11eb-8821-0b4f766e1e34.jpg)

#### Adjust the sphere radius

Objects with CullingTargetBehaviour attached will display a sphere (Bounding Sphere) like the one below.

![](./111072309-57e36c00-851d-11eb-8196-8c38b2af62c1.jpg)

This sphere is required for calculating whether the object is visible to the camera and how far it is from the player.

So make sure the sphere fully encloses the object.

As shown below, the sphere changes color depending on whether it is visible to the camera.

![](./111074733-bf061e00-8527-11eb-8e19-e6796e56c63a.jpg)

![](./111074737-c6c5c280-8527-11eb-9275-220103d8d59a.jpg)

#### Assign the key

CullingTargetBehaviour's GroupKey is used to find the CullingGroupProxy with the same key. When CullingTargetBehaviour starts up, it registers itself with the CullingGroupProxy that shares the same key.

#### Set Bounding Sphere Update Mode

This value is important for performance.

BoundingSphereUpdateMode is set to Dynamic by default. That means the sphere's position and radius are updated every frame.

However, some objects do not move. In those cases, setting BoundingSphereUpdateMode to Static lets you avoid unnecessary update cost.

### 3. Receive the callback

To receive notifications when the sphere's visibility and relative distance state changes, use CullingTargetBehaviour.OnStateChanged.

(For those who are thinking, "Wait, doesn't that still mean I have to write code?", there is also a general-purpose component that does not require coding.)

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

## General-purpose components

#### Culling Target Renderers

A component that enables or disables the registered Renderers based on the sphere's visibility.

The functionality shown in the opening video is implemented with this component.

![](./111073973-5cf7e980-8524-11eb-9b84-ab95c263940c.jpg)

## Closing Thoughts

We use this in actual development, and its usability, performance, and behavior on real devices have all been verified.

GitHub: [https://github.com/mackysoft/Vision](https://github.com/mackysoft/Vision)

[![](./Vision_Logo_Frame_Gray.png)](https://github.com/mackysoft/Vision)
