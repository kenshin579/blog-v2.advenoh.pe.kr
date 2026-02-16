# 딥러닝 기초 시리즈 - 학습 & 블로그 작성 PRD

## 배경

팀 내 AI 스터디에서 발표한 내용(이미지 구조 → NN → CNN → GAN)을 정리하여 블로그 시리즈로 작성한다.
원본 노트북(`ai study/`)의 MNIST 대신 **FashionMNIST**를 사용하여 차별화하고, 코드는 `tutorials-python/ai/deep-learning-basics/`에 Jupyter Notebook으로 작성한다.

## 시리즈 구성 (4편)

### 1편: 이미지의 디지털 표현과 신경망 첫걸음

> **블로그**: `docs/start/딥러닝-기초-1-이미지와-신경망-첫걸음/index.md`
> **코드**: `tutorials-python/ai/deep-learning-basics/01_image_and_nn_basics.ipynb`

**목차**:
1. 이미지는 숫자다
   - PIL과 numpy로 이미지 불러오기
   - 이미지의 shape: (height, width, channels)
   - RGB 채널 분리와 그레이스케일 변환
2. 텐서(Tensor) 소개
   - numpy 배열과 PyTorch 텐서 비교
   - device 설정 (CPU/CUDA)
3. 신경망의 가장 작은 단위: Linear 레이어
   - 입력 → 가중치(weight) × 입력 + 편향(bias) → 출력
   - `torch.nn.Linear` 사용법
4. 학습이란 무엇인가
   - 순전파(Forward): 예측값 계산
   - 손실함수(Loss Function): 예측과 정답의 차이 측정 (CrossEntropyLoss)
   - 역전파(Backward): 가중치에 대한 기울기 계산
   - 옵티마이저(SGD): 기울기 방향으로 가중치 업데이트
5. 간단한 분류 실습
   - 작은 입력으로 forward → loss → backward → step 한 사이클 체험
   - 학습 전후 weight 변화 확인

**핵심 포인트**: "이미지 = 숫자 배열", "학습 = weight 업데이트 반복"

---

### 2편: 완전연결 신경망으로 FashionMNIST 분류하기

> **블로그**: `docs/start/딥러닝-기초-2-완전연결-신경망과-FashionMNIST/index.md`
> **코드**: `tutorials-python/ai/deep-learning-basics/02_fc_nn_fashionmnist.ipynb`

**목차**:
1. FashionMNIST 데이터셋 소개
   - 10가지 패션 아이템 (T-shirt, Trouser, Pullover, Dress, Coat, Sandal, Shirt, Sneaker, Bag, Ankle boot)
   - 28×28 그레이스케일 이미지, 6만개 학습 + 1만개 테스트
   - 샘플 이미지 시각화 (matplotlib)
2. DataLoader로 배치 학습 준비
   - Dataset과 DataLoader 개념
   - batch_size의 의미와 선택
   - 이미지 Flatten: (28, 28) → (784,)
3. 1계층 신경망 (단일 Linear)
   - 784 → 10 분류기
   - 학습 루프 구현 (epoch, forward, loss, backward, step)
   - epoch별 cost 변화 관찰
4. 다계층 신경망으로 확장
   - 784 → 7840 → 7840 → 10 (3계층)
   - 파라미터 수 계산과 폭발적 증가
   - 학습 시간 비교 (1계층 vs 3계층)
5. 완전연결 신경망의 한계
   - 파라미터 수: 이미지 크기 × 계층 수에 비례하여 폭발
   - 실제 이미지(4K 등)에서는 학습 불가능
   - "이미지의 지역적 특징"을 활용하지 못하는 구조적 문제

**핵심 포인트**: "FC 레이어만으로는 파라미터가 너무 많아 실용적이지 않다"

---

### 3편: CNN으로 해결하는 파라미터 폭발 문제

> **블로그**: `docs/start/딥러닝-기초-3-CNN으로-이미지-분류/index.md`
> **코드**: `tutorials-python/ai/deep-learning-basics/03_cnn_fashionmnist.ipynb`

**목차**:
1. 합성곱(Convolution)이란
   - 필터(커널)가 이미지 위를 슬라이딩하며 특징 추출
   - 지역적 연결(Local Connectivity): 전체가 아닌 작은 영역만 연결
   - 파라미터 공유(Parameter Sharing): 같은 필터를 전체 이미지에 재사용
2. CNN의 핵심 구성 요소
   - `Conv2d`: 합성곱 레이어 (커널 크기, 채널 수)
   - `ReLU`: 활성화 함수 (비선형성 추가)
   - `MaxPool2d`: 풀링 레이어 (공간 크기 축소)
   - `Dropout`: 과적합 방지
3. CNN 모델 구현
   - Conv2d(1→32) → ReLU → Conv2d(32→64) → ReLU → MaxPool → FC → 출력
   - 모델 구조 출력 및 파라미터 수 확인
4. FashionMNIST 학습 및 비교
   - FC NN과 동일한 조건으로 학습
   - FC NN vs CNN: 파라미터 수 비교
   - FC NN vs CNN: 학습 시간 비교
   - FC NN vs CNN: 최종 cost 비교
5. CNN이 효과적인 이유 정리
   - 지역성(Locality): 인접 픽셀 간 관계 활용
   - 파라미터 효율: FC 대비 훨씬 적은 파라미터로 높은 성능
   - 계층적 특징 학습: 저수준(엣지) → 고수준(형태) 자동 추출

**핵심 포인트**: "CNN은 이미지의 지역적 특성을 활용하여 적은 파라미터로 높은 성능을 달성한다"

---

### 4편: GAN으로 이미지 생성하기

> **블로그**: `docs/start/딥러닝-기초-4-GAN으로-이미지-생성/index.md`
> **코드**: `tutorials-python/ai/deep-learning-basics/04_gan_fashionmnist.ipynb`

**목차**:
1. 생성 모델이란
   - 분류(Discriminative) vs 생성(Generative) 모델의 차이
   - "데이터 분포를 학습하여 새로운 샘플을 만든다"
2. GAN의 구조
   - Generator(생성자): 랜덤 노이즈 → 가짜 이미지 생성
   - Discriminator(판별자): 진짜/가짜 이미지 판별
   - 적대적 학습: 위조범 vs 감정사의 비유
3. 모델 구현
   - Generator: Linear(100→256→256→784) + ReLU + Tanh
   - Discriminator: Linear(784→256→256→1) + LeakyReLU + Sigmoid
   - BCELoss (Binary Cross Entropy)
4. 학습 과정
   - Discriminator 학습: 진짜는 1, 가짜는 0으로 판별하도록
   - Generator 학습: 가짜를 1로 판별하게 속이도록
   - p_real과 p_fake 수렴 과정 관찰
   - 에포크별 생성 이미지 시각화
5. 학습 결과 분석
   - 초기 노이즈 → 점점 패션 아이템 형태로 변화
   - GAN 학습의 어려움 (모드 붕괴, 불안정성)
   - 현대 생성 모델(Diffusion 등)로의 발전 방향 간략 소개

**핵심 포인트**: "Generator와 Discriminator의 경쟁을 통해 새로운 이미지를 '창조'할 수 있다"

---

## 코드 디렉토리 구조

```
tutorials-python/
└── ai/
    └── deep-learning-basics/
        ├── README.md
        ├── requirements.txt          # torch, torchvision, matplotlib, Pillow, numpy
        ├── 01_image_and_nn_basics.ipynb
        ├── 02_fc_nn_fashionmnist.ipynb
        ├── 03_cnn_fashionmnist.ipynb
        └── 04_gan_fashionmnist.ipynb
```

## 블로그 디렉토리 구조

```
blog-v2.advenoh.pe.kr/docs/start/
├── 딥러닝-기초-1-이미지와-신경망-첫걸음/index.md
├── 딥러닝-기초-2-완전연결-신경망과-FashionMNIST/index.md
├── 딥러닝-기초-3-CNN으로-이미지-분류/index.md
└── 딥러닝-기초-4-GAN으로-이미지-생성/index.md
```

## 원본과의 차별화 포인트

| 항목 | 원본 (ai study/) | 블로그 시리즈 |
|---|---|---|
| 데이터셋 | MNIST (숫자) | **FashionMNIST** (패션 아이템) |
| 형식 | 코드 위주 | 개념 설명 + 코드 + 다이어그램 |
| 시각화 | 최소한 | 학습 과정 시각화 포함 |
| 구성 | 발표용 노트북 | 독자 친화적 블로그 시리즈 |
| 설명 | 주석 위주 | 단계별 상세 해설 |

## 작업 순서

1. **코드 먼저**: `tutorials-python/ai/deep-learning-basics/` 에 노트북 4개 작성
2. **블로그 작성**: 코드를 참조하며 블로그 4편 작성 (`docs/start/`)
3. **PR 생성**: 각 repo에서 feature 브랜치 → PR

## 참고 자료

- PyTorch 공식 튜토리얼: https://pytorch.org/tutorials/
- FashionMNIST: https://github.com/zalandoresearch/fashion-mnist
- CNN 시각화: https://poloclub.github.io/cnn-explainer/
- GAN 원논문: Goodfellow et al., 2014
