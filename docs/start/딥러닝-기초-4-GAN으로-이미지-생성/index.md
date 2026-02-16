---
title: "딥러닝 기초 4편 - GAN으로 이미지 생성하기"
description: "GAN(생성적 적대 신경망)의 원리를 이해하고, Generator와 Discriminator를 구현하여 FashionMNIST 패션 아이템 이미지를 생성합니다"
date: 2026-02-16
update: 2026-02-16
tags:
  - deep-learning
  - pytorch
  - gan
  - generative-model
  - fashionmnist
  - python
series: "딥러닝 기초 시리즈"
---

> 이 글은 **딥러닝 기초 시리즈** 4편 중 마지막 편입니다.
> 전체 코드는 [tutorials-python/ai/deep-learning-basics](https://github.com/kenshin579/tutorials-python/tree/master/ai/deep-learning-basics)에서 확인할 수 있습니다.

지금까지 이미지를 **분류**하는 모델을 학습했습니다. 이번 편에서는 방향을 완전히 바꿔, 아무것도 없는 상태에서 **새로운 이미지를 생성**하는 모델을 만들어봅니다.

## 1. 분류 모델 vs 생성 모델

```mermaid
flowchart LR
    subgraph 분류["분류 모델 (Discriminative)"]
        direction LR
        I1["이미지 🖼️"] --> C["모델"] --> L["레이블<br/>Sneaker"]
    end
    subgraph 생성["생성 모델 (Generative)"]
        direction LR
        N["랜덤 노이즈"] --> G["모델"] --> I2["새 이미지 🖼️"]
    end
```

| | 분류 모델 | 생성 모델 |
|---|---|---|
| 입력 | 이미지 | 랜덤 노이즈 |
| 출력 | 클래스 레이블 | 새로운 이미지 |
| 학습 대상 | 클래스 경계 | **데이터의 확률 분포** |
| 예시 | "이것은 Sneaker" | "Sneaker처럼 보이는 이미지 생성" |

생성 모델은 학습 데이터의 **확률 분포**를 학습하여, 그 분포에서 새로운 샘플을 뽑아냅니다.

## 2. GAN의 구조

**GAN(Generative Adversarial Network, 생성적 적대 신경망)**은 2014년 Ian Goodfellow가 제안한 모델로, 두 개의 신경망이 서로 **경쟁(적대적 학습)**하며 발전합니다.

```mermaid
flowchart TB
    Z["랜덤 노이즈<br/>(64차원)"] --> G["Generator<br/>위조범"]
    G --> FI["가짜 이미지"]
    RD["학습 데이터"] --> RI["진짜 이미지"]
    FI --> D["Discriminator<br/>감정사"]
    RI --> D
    D --> P["진짜 확률<br/>[0, 1]"]
```

| 구성 요소 | 비유 | 역할 |
|---|---|---|
| Generator | 위조범 | 랜덤 노이즈로부터 가짜 이미지를 생성 |
| Discriminator | 감정사 | 진짜/가짜 이미지를 판별 |

학습이 진행되면:
- Generator는 점점 정교한 가짜 이미지를 만들고
- Discriminator는 점점 정밀하게 판별하려 하며
- 최종적으로 Generator가 **진짜와 구별 불가능한 이미지**를 생성하게 됩니다

## 3. 데이터 준비

GAN에서는 이미지의 픽셀 값을 **[-1, 1] 범위**로 정규화합니다. Generator의 출력 활성화 함수인 Tanh의 출력 범위가 [-1, 1]이기 때문입니다.

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.datasets as dsets
import torchvision.transforms as transforms
import numpy as np
from matplotlib import pyplot as plt

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

standardizer = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=(0.5,), std=(0.5,))  # [0,1] → [-1,1]
])

train_data = dsets.FashionMNIST(
    root="data/", train=True, transform=standardizer, download=True
)

batch_size = 64
train_loader = torch.utils.data.DataLoader(
    train_data, batch_size, shuffle=True, drop_last=True
)
```

## 4. 모델 구현

### Generator (생성자)

랜덤 노이즈(64차원)를 받아 28×28 이미지를 생성합니다. 4개의 확장 레이어(64→128→256→512→784)를 거치며 점진적으로 이미지를 만들어냅니다.

```mermaid
flowchart LR
    A["노이즈<br/>(64)"] --> B["Linear+BN+LeakyReLU<br/>(128)"]
    B --> C["Linear+BN+LeakyReLU<br/>(256)"]
    C --> D["Linear+BN+LeakyReLU<br/>(512)"]
    D --> E["Linear+Tanh<br/>(784)"]
    E --> F["이미지<br/>(28×28)"]
```

```python
d_noise = 64

def make_noise(batch_size, d_noise=64):
    return torch.randn(batch_size, d_noise, device=device)

G = nn.Sequential(
    nn.Linear(d_noise, 128),
    nn.BatchNorm1d(128),
    nn.LeakyReLU(0.2),
    nn.Linear(128, 256),
    nn.BatchNorm1d(256),
    nn.LeakyReLU(0.2),
    nn.Linear(256, 512),
    nn.BatchNorm1d(512),
    nn.LeakyReLU(0.2),
    nn.Linear(512, 28 * 28),
    nn.Tanh(),
).to(device)
```

**Tanh**를 사용하는 이유: 이미지 픽셀이 [-1, 1]로 정규화되어 있으므로, Generator의 출력도 같은 범위여야 합니다.

**BatchNorm1d**을 사용하는 이유: 각 레이어의 출력을 정규화하여 학습을 안정화합니다. GAN의 Generator에서 BatchNorm은 모드 붕괴를 방지하는 핵심 기법입니다.

**LeakyReLU**를 사용하는 이유 (Generator에서도): ReLU 대신 LeakyReLU를 사용하면 음수 영역에서도 기울기가 유지되어 더 안정적인 학습이 가능합니다.

### Discriminator (판별자)

28×28 이미지를 받아 "진짜일 확률"을 출력합니다.

```python
D = nn.Sequential(
    nn.Linear(28 * 28, 512),
    nn.LeakyReLU(0.2),
    nn.Dropout(0.3),
    nn.Linear(512, 256),
    nn.LeakyReLU(0.2),
    nn.Dropout(0.3),
    nn.Linear(256, 1),
    nn.Sigmoid(),
).to(device)
```

**LeakyReLU**를 사용하는 이유: 일반 ReLU는 음수 입력을 모두 0으로 만들어 기울기가 사라지는 문제(dying ReLU)가 있습니다. LeakyReLU는 음수에도 작은 기울기(0.2)를 허용하여 안정적인 학습을 돕습니다.

### 파라미터 수

```python
print(f"Generator 파라미터:     {sum(p.numel() for p in G.parameters()):,}")
# Generator 파라미터:     576,912
print(f"Discriminator 파라미터: {sum(p.numel() for p in D.parameters()):,}")
# Discriminator 파라미터: 533,505
```

두 모델 합쳐 **약 111만 개**입니다. Generator에 BatchNorm 레이어가 추가되고 은닉층이 더 커졌기 때문에 이전 구조보다 파라미터가 늘었지만, 학습 안정성과 생성 품질이 크게 향상됩니다.

## 5. GAN 학습 과정

매 배치마다 두 단계로 학습합니다:

### Discriminator 학습

진짜 이미지는 1, 가짜 이미지는 0으로 판별하도록 학습합니다. 손실 함수로 `nn.BCELoss()`를 사용합니다.

```python
criterion = nn.BCELoss()

# 진짜 이미지에 대한 판별
real_labels = torch.full((batch_size, 1), 0.9, device=device)  # 레이블 스무딩
p_real = D(real_images.view(-1, 28*28))
loss_real = criterion(p_real, real_labels)

# 가짜 이미지에 대한 판별
fake_labels = torch.zeros(batch_size, 1, device=device)
fake_images = G(make_noise(batch_size))
p_fake = D(fake_images.detach())
loss_fake = criterion(p_fake, fake_labels)

loss_d = loss_real + loss_fake
loss_d.backward()
opt_d.step()
```

**레이블 스무딩**: 진짜 이미지의 레이블을 1.0 대신 0.9로 설정합니다. 이는 Discriminator가 과도하게 확신하는 것을 방지하여 학습을 안정화합니다.

**BCELoss**: 이전에 `-torch.log()`로 직접 계산하던 Binary Cross Entropy를 `nn.BCELoss()`로 대체했습니다. 결과는 동일하지만 코드가 간결하고 수치적으로 더 안정적입니다.

### Generator 학습

가짜 이미지를 Discriminator가 **진짜로 판별**하도록 속이는 방향으로 학습합니다.

```python
real_labels = torch.ones(batch_size, 1, device=device)
p_fake = D(G(make_noise(batch_size)))
loss_g = criterion(p_fake, real_labels)
loss_g.backward()
opt_g.step()
```

### 전체 학습 루프

```python
def init_weights(m):
    if isinstance(m, nn.Linear):
        nn.init.kaiming_normal_(m.weight)
        if m.bias is not None:
            nn.init.zeros_(m.bias)

G.apply(init_weights)
D.apply(init_weights)

opt_g = optim.Adam(G.parameters(), lr=0.0001, betas=(0.5, 0.999))
opt_d = optim.Adam(D.parameters(), lr=0.0001, betas=(0.5, 0.999))

# 고정 노이즈: 학습 진행 상황을 일관되게 추적
fixed_noise = make_noise(64)

for epoch in range(100):
    train_one_epoch(G, D, opt_g, opt_d)
    p_real, p_fake = evaluate(G, D)

    if (epoch + 1) % 10 == 0:
        print(f"Epoch {epoch+1:3d} | p_real: {p_real:.4f} | p_fake: {p_fake:.4f}")
        # fixed_noise로 이미지 생성하여 진행 상황 시각화
        with torch.no_grad():
            samples = G(fixed_noise).view(-1, 28, 28)
```

**Kaiming 초기화**: ReLU/LeakyReLU 활성화 함수에 최적화된 초기화 방법입니다. Xavier 초기화보다 더 적합합니다.

**betas=(0.5, 0.999)**: GAN 학습에서 흔히 사용하는 Adam 하이퍼파라미터입니다. 기본값보다 낮은 beta1은 momentum을 줄여 학습을 안정화합니다.

**고정 노이즈(fixed_noise)**: 매 에포크마다 동일한 노이즈로 이미지를 생성하면, Generator의 학습 진행 상황을 일관되게 비교할 수 있습니다.

## 6. 학습 결과 분석

### p_real과 p_fake의 수렴

- **p_real**: Discriminator가 진짜 이미지를 진짜로 판별하는 확률
- **p_fake**: Discriminator가 가짜 이미지를 진짜로 판별하는 확률

이상적인 수렴: **둘 다 0.5**에 수렴합니다. 이는 Discriminator가 진짜와 가짜를 **전혀 구별하지 못한다**는 의미입니다 — Generator가 완벽한 이미지를 생성하고 있다는 뜻입니다.

### 에포크별 생성 이미지 변화

학습 초기에는 Generator가 노이즈만 출력하지만, 학습이 진행될수록 점점 패션 아이템의 형태가 나타납니다:

| 에포크 | 생성 이미지 특징 |
|---|---|
| 1~10 | 의미 없는 노이즈 |
| 20~30 | 흐릿한 형태가 나타남 |
| 50~70 | 옷, 신발의 윤곽이 보임 |
| 80~100 | 패션 아이템으로 인식 가능한 이미지 |

## 7. GAN 학습의 어려움

GAN은 강력하지만, 학습이 쉽지 않습니다:

### 모드 붕괴(Mode Collapse)

Generator가 **한 가지 종류의 이미지만** 반복적으로 생성하는 현상입니다. 예를 들어 10가지 패션 아이템 중 Trouser만 계속 생성하는 경우입니다.

원인: Generator가 Discriminator를 속이는 "안전한" 출력 하나를 발견하면, 다양성을 포기하고 그것만 반복합니다.

### 학습 불안정

Generator와 Discriminator의 학습 속도 균형이 중요합니다:
- Discriminator가 너무 강하면: Generator의 기울기가 사라져 학습 불가
- Generator가 너무 강하면: Discriminator가 학습할 동기를 잃음

### 평가 기준 부재

분류 모델은 정확도(accuracy)로 성능을 측정하지만, 생성 모델은 "이미지가 얼마나 자연스러운가"를 객관적으로 측정하기 어렵습니다. FID(Frechet Inception Distance) 같은 지표가 사용되지만, 완벽하지 않습니다.

## 노이즈 공간 탐험

두 개의 랜덤 노이즈 벡터 사이를 보간(interpolation)하면 Generator가 학습한 **잠재 공간(latent space)**을 탐험할 수 있습니다.

```python
z1 = make_noise(1)
z2 = make_noise(1)

steps = 8
for i, alpha in enumerate(np.linspace(0, 1, steps)):
    z = z1 * (1 - alpha) + z2 * alpha
    img = G(z).view(28, 28)
```

이 결과는 Generator가 단순히 학습 데이터를 암기한 것이 아니라, 패션 아이템의 **의미 있는 표현**을 학습했음을 보여줍니다. 예를 들어 운동화와 앵클부츠 사이를 보간하면, 중간 단계에서 두 스타일이 자연스럽게 혼합된 이미지가 나타납니다. 이는 잠재 공간이 연속적이고 매끄럽게 구성되어 있다는 증거입니다.

## 시리즈 전체 요약

```mermaid
flowchart TB
    A["1편: 이미지 = 숫자 배열<br/>학습 = weight 업데이트"] --> B["2편: FC NN<br/>계층 쌓기 → 파라미터 폭발"]
    B --> C["3편: CNN<br/>지역성 활용 → 적은 파라미터로 높은 성능"]
    C --> D["4편: GAN<br/>Generator vs Discriminator → 이미지 생성"]
```

| 편 | 모델 | 핵심 메시지 |
|---|---|---|
| 1편 | Linear | 이미지는 숫자 배열이며, 학습은 가중치를 업데이트하는 반복이다 |
| 2편 | FC NN | 완전연결 신경망은 계층을 쌓을수록 파라미터가 폭발한다 |
| 3편 | CNN | 합성곱은 이미지의 지역성을 활용하여 적은 파라미터로 높은 성능을 달성한다 |
| 4편 | GAN | Generator와 Discriminator의 경쟁을 통해 새로운 이미지를 생성할 수 있다 |

이 시리즈에서 다룬 개념들은 현대 AI의 기반입니다. 최근 화제인 Stable Diffusion, DALL-E 같은 이미지 생성 모델도 GAN의 아이디어에서 출발하여 Diffusion 기법으로 발전한 것입니다.

## 참고 자료

- [GAN 원논문 - Goodfellow et al., 2014](https://arxiv.org/abs/1406.2661)
- [PyTorch DCGAN 튜토리얼](https://pytorch.org/tutorials/beginner/dcgan_faces_tutorial.html)
- [전체 소스 코드 - tutorials-python/ai/deep-learning-basics](https://github.com/kenshin579/tutorials-python/tree/master/ai/deep-learning-basics)
