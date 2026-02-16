---
title: "딥러닝 기초 2편 - 완전연결 신경망으로 FashionMNIST 분류하기"
description: "FashionMNIST 데이터셋을 사용하여 1계층, 다계층 완전연결(FC) 신경망을 구현하고, 파라미터 폭발 문제를 직접 체감합니다"
date: 2026-02-16
update: 2026-02-16
tags:
  - deep-learning
  - pytorch
  - neural-network
  - fashionmnist
  - python
series: "딥러닝 기초 시리즈"
---

> 이 글은 **딥러닝 기초 시리즈** 4편 중 2편입니다.
> 전체 코드는 [tutorials-python/ai/deep-learning-basics](https://github.com/kenshin579/tutorials-python/tree/master/ai/deep-learning-basics)에서 확인할 수 있습니다.

1편에서 이미지가 숫자 배열이라는 것과 학습의 기본 사이클을 배웠습니다.
이번 편에서는 실제 이미지 데이터셋인 **FashionMNIST**를 사용하여 완전연결(Fully Connected) 신경망을 학습하고, **계층을 쌓을수록 파라미터가 폭발하는 문제**를 직접 확인합니다.

## 1. FashionMNIST 데이터셋

[FashionMNIST](https://github.com/zalandoresearch/fashion-mnist)는 Zalando에서 공개한 패션 아이템 이미지 데이터셋입니다. 기존 MNIST(손글씨 숫자)보다 분류 난이도가 높아 딥러닝 입문에 더 적합합니다.

| 항목 | 값 |
|---|---|
| 이미지 크기 | 28 × 28 (그레이스케일) |
| 학습 데이터 | 60,000장 |
| 테스트 데이터 | 10,000장 |
| 클래스 수 | 10 |

| 레이블 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| 클래스 | T-shirt | Trouser | Pullover | Dress | Coat | Sandal | Shirt | Sneaker | Bag | Ankle boot |

```python
import torch
from torch import nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision import datasets
from torchvision.transforms import ToTensor

training_data = datasets.FashionMNIST(
    root="data", train=True, download=True, transform=ToTensor(),
)
test_data = datasets.FashionMNIST(
    root="data", train=False, download=True, transform=ToTensor(),
)

print(f"학습 데이터: {len(training_data)}장")  # 60000
print(f"테스트 데이터: {len(test_data)}장")    # 10000
```

`ToTensor()`는 PIL 이미지를 PyTorch 텐서로 변환하면서 **픽셀 값을 0~255에서 0.0~1.0으로 정규화**합니다.

## 2. DataLoader로 배치 학습 준비

전체 60,000장을 한 번에 학습하면 메모리 부족과 비효율이 발생합니다. **DataLoader**는 데이터를 배치(batch) 단위로 나누어 제공합니다.

```python
batch_size = 64
train_dataloader = DataLoader(training_data, batch_size=batch_size)

for images, labels in train_dataloader:
    print(f"배치 이미지 shape: {images.shape}")
    # torch.Size([64, 1, 28, 28])
    # → 64장 × 1채널 × 28×28
    print(f"Flatten 후: {images.view(-1, 28 * 28).shape}")
    # torch.Size([64, 784])
    break
```

| 개념 | 설명 |
|---|---|
| Dataset | 개별 데이터(이미지, 레이블)에 접근하는 인터페이스 |
| DataLoader | 배치 단위로 데이터를 묶어 반복자(iterator)로 제공 |
| batch_size | 한 번에 학습할 데이터 수 (64이면 938 배치) |
| Flatten | 2D 이미지(28×28)를 1D 벡터(784)로 펼치는 연산 |

FC 레이어에 입력하려면 2D 이미지를 1D 벡터로 **Flatten**해야 합니다. 이 과정에서 **픽셀 간의 공간적 관계가 사라진다**는 점이 중요합니다.

## 3. 1계층 완전연결 신경망

가장 단순한 구조부터 시작합니다.

```mermaid
flowchart LR
    A["이미지<br/>28×28"] --> B["Flatten<br/>784"]
    B --> C["Linear<br/>784→10"]
    C --> D["출력<br/>10 클래스"]
```

```python
device = "cuda" if torch.cuda.is_available() else "cpu"

class SingleLayerNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(28 * 28, 10)

    def forward(self, x):
        return self.linear(x)

single_net = SingleLayerNet().to(device)

total_params = sum(p.numel() for p in single_net.parameters())
print(f"총 파라미터 수: {total_params:,}개")  # 7,850개
```

파라미터 수: **784 × 10 + 10(bias) = 7,850개**

### 학습 실행

```python
import time

optimizer = torch.optim.Adam(single_net.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss().to(device)

for epoch in range(15):
    start_time = time.time()
    avg_cost = 0
    total_batch = len(train_dataloader)

    for X, Y in train_dataloader:
        X = X.view(-1, 28 * 28).to(device)  # Flatten
        Y = Y.to(device)
        optimizer.zero_grad()
        hypothesis = single_net(X)
        cost = criterion(hypothesis, Y)
        cost.backward()
        optimizer.step()
        avg_cost += cost.item() / total_batch

    elapsed = time.time() - start_time
    print(f"Epoch {epoch+1:02d} | cost = {avg_cost:.6f} | time = {elapsed:.2f}s")
```

15 에포크를 학습하면 cost가 점차 줄어드는 것을 확인할 수 있습니다.

## 4. 다계층 완전연결 신경망

"계층을 더 쌓으면 성능이 좋아지지 않을까?" — 맞는 말이지만, 활성화 함수와 정규화 기법을 함께 적용해야 효과적입니다.

```mermaid
flowchart LR
    A["이미지<br/>784"] --> B["Linear+ReLU<br/>784→512"]
    B --> C["Linear+ReLU<br/>512→256"]
    C --> D["Linear<br/>256→10"]
    D --> E["출력"]
```

```python
class MultiLayerNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, 10)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        return x
```

### 파라미터 수 비교

| 레이어 | 계산 | 파라미터 수 |
|---|---|---|
| fc1 (784→512) | 784 × 512 + 512 | 401,920 |
| fc2 (512→256) | 512 × 256 + 256 | 131,328 |
| fc3 (256→10) | 256 × 10 + 10 | 2,570 |
| **합계** | | **535,818** |

1계층(7,850개) 대비 **약 68배** 증가했습니다. 이전 예시처럼 히든 레이어를 7,840 차원으로 잡으면 6,700만 개까지 폭발하지만, 실용적인 크기(512, 256)로 설계하면 파라미터 수를 합리적으로 유지할 수 있습니다.

## 5. 1계층 vs 다계층 비교

같은 조건(Adam, lr=0.001, 15 에포크)으로 학습한 결과를 비교합니다.

| 항목 | 1계층 FC | 3계층 FC | 배율 |
|---|---|---|---|
| 파라미터 수 | 7,850 | 535,818 | 68x |
| 최종 cost | ~0.40 | ~0.29 | - |

실용적인 히든 레이어 크기(512, 256)와 ReLU 활성화 함수, Dropout 정규화를 적용한 3계층 네트워크는 파라미터 수가 약 53만 개로 합리적인 수준이며, 1계층보다 낮은 cost를 달성합니다. 하지만 이것은 겨우 28×28의 작은 이미지입니다.

## 완전연결 신경망의 한계

현재는 28×28 = 784차원의 아주 작은 그레이스케일 이미지입니다. 실제 환경에서는 어떨까요?

| 이미지 유형 | 크기 | FC 1계층 파라미터 (→10 출력) |
|---|---|---|
| FashionMNIST | 28×28×1 | 7,850 |
| VGA 컬러 | 640×480×3 | 9,216,010 |
| Full HD | 1920×1080×3 | 62,208,010 |
| 4K | 3840×2160×3 | 248,832,010 |

4K 이미지를 **1계층**으로만 처리해도 파라미터가 **2억 5천만 개**입니다. 실용적인 히든 레이어 크기를 사용하더라도, 입력 차원 자체가 거대하기 때문에 첫 번째 레이어의 파라미터 수를 줄이기 어렵습니다.

하지만 파라미터 수보다 더 근본적인 문제는 **이미지의 공간적 구조를 활용하지 못한다**는 것입니다:
- FC 레이어는 모든 픽셀을 1차원으로 펼침 → 인접 픽셀 간의 관계가 사라짐
- 옷의 소매, 신발의 밑창 같은 **지역적 패턴**을 인식할 구조적 방법이 없음

다음 편에서 **CNN(합성곱 신경망)**이 이 문제를 어떻게 해결하는지 살펴봅니다.

## 참고 자료

- [FashionMNIST - Zalando Research](https://github.com/zalandoresearch/fashion-mnist)
- [PyTorch DataLoader 공식 문서](https://pytorch.org/docs/stable/data.html)
- [전체 소스 코드 - tutorials-python/ai/deep-learning-basics](https://github.com/kenshin579/tutorials-python/tree/master/ai/deep-learning-basics)
