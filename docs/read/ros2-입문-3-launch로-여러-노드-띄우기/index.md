---
title: "ROS2 입문 3편 - launch로 여러 노드 한 번에 띄우기"
description: "launch 파일로 여러 노드를 한 번에 실행하고, 파라미터를 YAML로 분리하며, 네임스페이스로 같은 노드를 여러 개 띄우는 방법을 실습한다."
date: 2026-09-14
update: 2026-09-14
tags:
  - ros2
  - ros
  - jazzy
  - launch
  - parameter
  - yaml
  - namespace
  - 로봇
  - robot
series: "ROS2 입문"
seriesOrder: 3
---

<!-- TODO(초안 메모, 발행 전 삭제): 명령어 출력은 Mac + Docker(ros:jazzy-ros-base, arm64)에서 캡처했다. 네이티브 환경에서 검증하고, TODO(실습) 스크린샷을 채우고, 1·2편 링크를 실제 URL로 교체할 것. -->

2편에서는 노드 두 개를 터미널 두 개에 나눠 띄웠다. 노드가 두 개일 때는 견딜 만하지만, 실제 로봇은 센서 드라이버, 위치 추정, 경로 계획, 모터 제어까지 노드가 수십 개다. 터미널을 수십 개 열 수는 없다.

이번 편에서는 **launch 파일**로 여러 노드를 한 번에 띄우고, 파라미터를 파일로 분리하며, 같은 노드를 이름만 바꿔 여러 개 실행한다. Docker Compose가 컨테이너 여러 개를 한 파일로 정의하는 것과 같은 역할이라고 보면 된다.

**예제 코드**: [kenshin579/tutorials-python - ros2](https://github.com/kenshin579/tutorials-python/tree/master/ros2)

# 1. 첫 launch 파일 만들기

## 1.1 파일 작성

패키지 안에 `launch` 디렉토리를 만들고 파일을 둔다. 파일 이름은 `_launch.py`로 끝내는 것이 관례다.

```bash
mkdir -p ~/ros2_ws/src/py_pubsub/launch
```

`launch/temperature_launch.py`

```python
"""발행 노드와 구독 노드를 한 번에 실행하는 가장 단순한 launch 파일."""

from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    talker = Node(
        package='py_pubsub',
        executable='talker',
        name='temperature_publisher',
        output='screen',
    )

    listener = Node(
        package='py_pubsub',
        executable='listener',
        name='temperature_subscriber',
        output='screen',
    )

    return LaunchDescription([talker, listener])
```

구조는 간단하다. `generate_launch_description()`이라는 **이름이 정해진 함수**를 만들고, 실행할 것들을 담은 `LaunchDescription`을 반환한다. launch 시스템이 이 함수를 호출해서 무엇을 실행할지 알아낸다.

`Node` 액션의 인자는 이렇다.

| 인자 | 의미 |
|---|---|
| `package` | 패키지 이름 |
| `executable` | `setup.py`의 entry_points에 등록한 이름 |
| `name` | 실행될 노드 이름 (코드에 적은 이름을 덮어쓴다) |
| `output` | `screen`이면 로그가 터미널에 바로 나온다 |

## 1.2 설치 설정 - 가장 많이 걸리는 함정

파일만 만들면 `ros2 launch`가 찾지 못한다. **`setup.py`에서 launch 파일을 설치 대상으로 등록해야 한다.**

```python
import os
from glob import glob

data_files=[
    ('share/ament_index/resource_index/packages',
        ['resource/' + package_name]),
    ('share/' + package_name, ['package.xml']),
    # launch 파일과 파라미터 파일을 share 디렉토리에 설치한다
    (os.path.join('share', package_name, 'launch'), glob('launch/*_launch.py')),
    (os.path.join('share', package_name, 'config'), glob('config/*.yaml')),
],
```

빌드하면 `install/` 아래에 복사된다.

```bash
cd ~/ros2_ws
colcon build
source install/setup.bash
tree install/py_pubsub/share/py_pubsub
```

```text
install/py_pubsub/share/py_pubsub
├── config
│   └── temperature_params.yaml
├── hook
│   ├── ament_prefix_path.dsv
│   ├── ament_prefix_path.ps1
│   ├── ament_prefix_path.sh
│   ├── pythonpath.dsv
│   ├── pythonpath.ps1
│   └── pythonpath.sh
├── launch
│   ├── temperature_launch.py
│   └── temperature_params_launch.py
├── package.bash
├── package.dsv
├── package.ps1
├── package.sh
├── package.xml
└── package.zsh

4 directories, 15 files
```

`launch/`와 `config/`가 보이면 제대로 등록된 것이다. **이 목록에 없으면 `ros2 launch`는 파일이 없다고 한다.** Python 코드만 고칠 때와 달리, `setup.py`를 고쳤을 때는 반드시 다시 빌드해야 한다.

## 1.3 실행

```bash
ros2 launch py_pubsub temperature_launch.py
```

```text
[INFO] [launch]: All log files can be found below /root/.ros/log/2026-09-13-16-02-29-512071-e24a5e0fe42b-752
[INFO] [launch]: Default logging verbosity is set to INFO
[INFO] [talker-1]: process started with pid [757]
[INFO] [listener-2]: process started with pid [758]
[listener-2] [INFO] [1789315349.689706879] [temperature_subscriber]: 온도 구독 노드 시작
[talker-1] [INFO] [1789315349.689939712] [temperature_publisher]: 온도 센서 노드 시작 (주기 1.0초)
[talker-1] [INFO] [1789315350.689393838] [temperature_publisher]: 발행: sensor-01 21.2도 (경고: False)
[listener-2] [INFO] [1789315350.689750629] [temperature_subscriber]: [1] 정상 sensor-01 온도 21.2도
[talker-1] [INFO] [1789315351.687217880] [temperature_publisher]: 발행: sensor-01 22.44도 (경고: False)
[listener-2] [INFO] [1789315351.687490463] [temperature_subscriber]: [2] 정상 sensor-01 온도 22.44도
[talker-1] [INFO] [1789315352.688923589] [temperature_publisher]: 발행: sensor-01 29.18도 (경고: False)
[listener-2] [INFO] [1789315352.689464172] [temperature_subscriber]: [3] 정상 sensor-01 온도 29.18도
[talker-1] [INFO] [1789315353.689365797] [temperature_publisher]: 발행: sensor-01 30.43도 (경고: True)
[listener-2] [WARN] [1789315353.689917297] [temperature_subscriber]: [4] 경고! sensor-01 온도 30.43도
```

터미널 하나에서 두 노드가 함께 돌아간다. 로그 앞에 `[talker-1]`, `[listener-2]` 접두사가 붙어서 어느 프로세스가 남긴 로그인지 구분된다. `docker compose up`의 출력과 비슷하다.

`Ctrl+C`를 한 번 누르면 launch가 띄운 모든 노드가 함께 종료된다.

<!-- TODO(실습): ros2 launch 실행 화면 스크린샷 → launch_run.png -->

# 2. launch 파일의 세 가지 형식

ROS2 launch는 Python, XML, YAML 세 형식을 지원한다.

| 형식 | 장점 | 단점 |
|---|---|---|
| **Python** | 조건 분기, 반복, 경로 계산 등 무엇이든 가능 | 문법이 장황하다 |
| XML | ROS1 방식과 비슷해 간결하다 | 복잡한 로직은 표현이 어렵다 |
| YAML | 읽기 쉽다 | 자료가 적고 표현력이 제한적이다 |

**Python을 권장한다.** 실제 로봇 프로젝트에서는 조건에 따라 노드를 켜고 끄거나, 패키지 설치 경로를 계산해야 할 일이 많다. 대부분의 공개 패키지도 Python launch를 쓴다. 이 글도 Python 기준이다.

# 3. 파라미터를 파일로 분리하기

2편에서는 파라미터를 `--ros-args -p`로 하나씩 넘겼다. 개수가 늘어나면 YAML 파일로 분리하는 편이 낫다.

## 3.1 파라미터 파일

`config/temperature_params.yaml`

```yaml
# 키는 노드 이름이다. 앞의 /** 는 "어떤 네임스페이스에 있든" 이라는 뜻이고,
# 네임스페이스를 쓰지 않는다면 temperature_publisher: 만 적어도 된다.
/**/temperature_publisher:
  ros__parameters:
    sensor_id: "living-01"
    publish_period: 1.0
    warning_threshold: 28.0
```

형식이 조금 특이하다. **맨 위 키가 노드 이름**이고, 그 아래 `ros__parameters`를 두고 값을 적는다. 한 파일에 여러 노드의 설정을 담을 수 있어서, 노드별 설정이 한곳에 모인다.

`/**`는 "어떤 네임스페이스에 있든"이라는 뜻의 와일드카드다. 뒤에서 네임스페이스를 쓸 것이라 미리 붙였다. 네임스페이스를 쓰지 않는다면 `temperature_publisher:`만 적어도 된다.

## 3.2 launch 파일에서 넘기기

```python
"""파라미터 파일, 네임스페이스, 리맵핑, launch 인자를 함께 쓰는 launch 파일."""

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    config = os.path.join(
        get_package_share_directory('py_pubsub'),
        'config',
        'temperature_params.yaml',
    )

    # 실행할 때 값을 바꿀 수 있는 launch 인자
    room_arg = DeclareLaunchArgument(
        'room',
        default_value='living_room',
        description='센서를 배치할 방 이름 (네임스페이스로 쓰인다)',
    )
    room = LaunchConfiguration('room')

    talker = Node(
        package='py_pubsub',
        executable='talker',
        name='temperature_publisher',
        namespace=room,
        parameters=[config],
        output='screen',
    )

    listener = Node(
        package='py_pubsub',
        executable='listener',
        name='temperature_subscriber',
        namespace=room,
        output='screen',
    )

    # 같은 노드를 다른 네임스페이스로 하나 더 띄운다 (멀티 센서)
    kitchen_talker = Node(
        package='py_pubsub',
        executable='talker',
        name='temperature_publisher',
        namespace='kitchen',
        parameters=[{
            'sensor_id': 'kitchen-01',
            'publish_period': 2.0,
            'warning_threshold': 26.0,
        }],
        output='screen',
    )

    return LaunchDescription([room_arg, talker, listener, kitchen_talker])
```

중요한 부분만 짚어 본다.

**`get_package_share_directory('py_pubsub')`**
설치된 패키지의 share 경로를 돌려준다. 소스 디렉토리 경로를 그대로 쓰면 다른 사람 PC에서 동작하지 않으므로, 설치 경로를 이 함수로 얻어 쓴다.

**`parameters=[config]`**
파일 경로를 넘긴다. 리스트인 이유는 여러 개를 넘길 수 있어서다. 뒤에 오는 것이 앞의 값을 덮어쓴다.

**`parameters=[{'sensor_id': 'kitchen-01', ...}]`**
딕셔너리를 직접 넘길 수도 있다. 값이 두세 개뿐이라면 이쪽이 간단하다.

# 4. 네임스페이스로 같은 노드 여러 개 띄우기

위 launch 파일은 온도 센서 노드를 **두 개** 띄운다. 하나는 거실, 하나는 주방이다. 노드 이름이 `temperature_publisher`로 같은데도 충돌하지 않는 이유는 `namespace`가 다르기 때문이다.

```python
namespace='kitchen',
```

네임스페이스는 노드 이름과 토픽 이름 앞에 붙는 접두사다. 쿠버네티스 네임스페이스와 이름이 같고 역할도 비슷하다.

```bash
ros2 launch py_pubsub temperature_params_launch.py
```

```text
[INFO] [launch]: All log files can be found below /root/.ros/log/2026-09-13-16-04-47-825174-cd7e709d007a-750
[INFO] [launch]: Default logging verbosity is set to INFO
[INFO] [talker-1]: process started with pid [755]
[INFO] [listener-2]: process started with pid [756]
[INFO] [talker-3]: process started with pid [757]
[listener-2] [INFO] [1789315487.996612263] [living_room.temperature_subscriber]: 온도 구독 노드 시작
[talker-3] [INFO] [1789315487.996616513] [kitchen.temperature_publisher]: 온도 센서 노드 시작 (주기 2.0초)
[talker-1] [INFO] [1789315487.996617763] [living_room.temperature_publisher]: 온도 센서 노드 시작 (주기 1.0초)
[talker-1] [INFO] [1789315488.995621805] [living_room.temperature_publisher]: 발행: living-01 30.91도 (경고: True)
[listener-2] [WARN] [1789315488.996010930] [living_room.temperature_subscriber]: [1] 경고! living-01 온도 30.91도
[talker-1] [INFO] [1789315489.993313305] [living_room.temperature_publisher]: 발행: living-01 26.15도 (경고: False)
[talker-3] [INFO] [1789315489.993318805] [kitchen.temperature_publisher]: 발행: kitchen-01 32.83도 (경고: True)
[listener-2] [INFO] [1789315489.993669930] [living_room.temperature_subscriber]: [2] 정상 living-01 온도 26.15도
[talker-1] [INFO] [1789315490.997988333] [living_room.temperature_publisher]: 발행: living-01 25.83도 (경고: False)
[listener-2] [INFO] [1789315490.999211291] [living_room.temperature_subscriber]: [3] 정상 living-01 온도 25.83도
[talker-1] [INFO] [1789315491.993884583] [living_room.temperature_publisher]: 발행: living-01 29.67도 (경고: True)
```

로그의 노드 이름이 `living_room.temperature_publisher`, `kitchen.temperature_publisher`로 구분된다. 거실 센서는 1초 주기, 주방 센서는 2초 주기로 도는 것도 보인다.

실행 중에 토픽 목록을 보면 이렇다.

```text
/bedroom/temperature
/kitchen/temperature
/parameter_events
/rosout
```

**코드에서는 토픽 이름을 `'temperature'`라고만 썼는데 `/bedroom/temperature`가 됐다.** 네임스페이스가 자동으로 붙은 것이다. 이렇게 앞에 `/`가 없는 이름을 **상대 이름**이라 하고, 네임스페이스의 영향을 받는다. 반대로 `/temperature`처럼 `/`로 시작하면 **절대 이름**이라 네임스페이스가 붙지 않는다.

> 노드 코드에서는 되도록 상대 이름을 써야 한다. 절대 이름을 쓰면 그 노드는 로봇 한 대에서만 동작하고, 여러 대를 동시에 굴릴 때 토픽이 충돌한다.

노드 목록도 네임스페이스별로 나뉜다.

```bash
ros2 node list
```

```text
/bedroom/temperature_publisher
/bedroom/temperature_subscriber
/kitchen/temperature_publisher
```

# 5. launch 인자로 실행할 때 값 바꾸기

launch 파일을 방마다 따로 만들 수는 없다. 실행할 때 값을 넘길 수 있어야 한다. 그것이 **launch 인자**다.

```python
room_arg = DeclareLaunchArgument(
    'room',
    default_value='living_room',
    description='센서를 배치할 방 이름 (네임스페이스로 쓰인다)',
)
room = LaunchConfiguration('room')
```

어떤 인자를 받는지는 `--show-args`로 확인한다.

```bash
ros2 launch py_pubsub temperature_params_launch.py --show-args
```

```text
Arguments (pass arguments as '<name>:=<value>'):

    'room':
        센서를 배치할 방 이름 (네임스페이스로 쓰인다)
        (default: 'living_room')
```

값을 넘겨 실행한다.

```bash
ros2 launch py_pubsub temperature_params_launch.py room:=bedroom
```

```text
[INFO] [launch]: All log files can be found below /root/.ros/log/2026-09-13-16-05-00-819385-cd7e709d007a-804
[INFO] [launch]: Default logging verbosity is set to INFO
[INFO] [talker-1]: process started with pid [807]
[INFO] [listener-2]: process started with pid [808]
[INFO] [talker-3]: process started with pid [809]
[listener-2] [INFO] [1789315500.946806171] [bedroom.temperature_subscriber]: 온도 구독 노드 시작
[talker-3] [INFO] [1789315500.946826838] [kitchen.temperature_publisher]: 온도 센서 노드 시작 (주기 2.0초)
[talker-1] [INFO] [1789315500.946917713] [bedroom.temperature_publisher]: 온도 센서 노드 시작 (주기 1.0초)
[talker-1] [INFO] [1789315501.943563088] [bedroom.temperature_publisher]: 발행: living-01 27.18도 (경고: False)
[listener-2] [INFO] [1789315501.943933047] [bedroom.temperature_subscriber]: [1] 정상 living-01 온도 27.18도
```

네임스페이스가 `bedroom`으로 바뀌었다. 파라미터 파일의 `/**` 와일드카드 덕분에 방 이름이 바뀌어도 `living-01` 설정이 그대로 적용된다.

## 5.1 LaunchConfiguration은 문자열이 아니다

여기서 한 번은 반드시 걸린다. `LaunchConfiguration('room')`은 **값이 아니라 "나중에 값으로 바뀔 자리"**다. launch 파일이 평가되는 시점에는 아직 값이 정해지지 않았기 때문이다.

```python
room = LaunchConfiguration('room')

print(room)                      # 값이 아니라 객체가 찍힌다
path = '/home/' + room           # TypeError
if room == 'kitchen':            # 항상 False
```

문자열처럼 다루려면 `PythonExpression`이나 `PathJoinSubstitution` 같은 치환(substitution) 도구를 써야 한다. 지연 평가되는 템플릿 변수라고 생각하면 이해가 쉽다.

# 6. 실행 중인 노드의 파라미터 다루기

launch로 띄운 뒤에도 2편에서 쓴 파라미터 명령이 그대로 통한다. 노드 이름 앞에 네임스페이스를 붙여야 한다는 점만 다르다.

```bash
ros2 param get /bedroom/temperature_publisher sensor_id
ros2 param get /bedroom/temperature_publisher warning_threshold
ros2 param get /kitchen/temperature_publisher publish_period
```

```text
String value is: living-01
Double value is: 28.0
Double value is: 2.0
```

파일에서 온 값(`living-01`, `28.0`)과 launch 파일에 직접 적은 값(`2.0`)이 각각 적용된 것을 볼 수 있다.

실행 중에 값을 바꿀 수도 있다.

```bash
ros2 param set /bedroom/temperature_publisher warning_threshold 20.0
```

```text
Set parameter successful
```

다만 이렇게 바꾼 값은 노드를 다시 띄우면 사라진다. 튜닝한 값을 남기려면 `ros2 param dump`로 뽑아 파라미터 파일에 반영한다.

참고로 파라미터가 적용되는 우선순위는 아래와 같다. 뒤쪽이 앞쪽을 덮어쓴다.

1. 코드의 `declare_parameter` 기본값
2. launch 파일의 `parameters=[파일]`
3. launch 파일의 `parameters=[{딕셔너리}]`
4. 실행 시 `--ros-args -p`
5. 실행 중 `ros2 param set`

# 7. 자주 막히는 지점

**`file 'xxx_launch.py' was not found`**
`setup.py`의 `data_files`에 launch 디렉토리를 등록하지 않았거나, 등록 후 다시 빌드하지 않은 것이다. `ls install/py_pubsub/share/py_pubsub/launch`로 실제 설치 여부를 확인한다.

**YAML 파라미터가 적용되지 않는다**
이 글을 쓰면서 실제로 겪은 문제다. 파라미터 파일에 `temperature_publisher:`라고만 적고 노드를 네임스페이스 안에서 띄웠더니, 값이 전부 기본값으로 나왔다. **파라미터 파일의 키는 네임스페이스까지 포함한 전체 노드 이름과 정확히 일치해야 한다.** 에러도 경고도 없이 조용히 무시되기 때문에 찾기 어렵다.

```yaml
# 노드가 /bedroom/temperature_publisher 로 뜨는 경우
temperature_publisher:        # 적용 안 됨
/bedroom/temperature_publisher:  # 적용됨 (방 이름이 바뀌면 또 안 됨)
/**/temperature_publisher:    # 어떤 네임스페이스든 적용됨
```

파라미터가 반영됐는지는 `ros2 param get`으로 확인하는 습관을 들이는 게 좋다.

**`ros2 node list`에 노드가 덜 보인다**
노드가 뜨자마자 조회하면 discovery가 끝나지 않아 일부만 보일 수 있다. 몇 초 뒤에 다시 실행하면 정상으로 나온다.

**로그가 안 보인다**
`Node(...)`에 `output='screen'`을 빼면 로그가 파일로만 남는다.

**노드 이름이 코드와 다르다**
launch 파일의 `name=`이 코드의 노드 이름을 덮어쓴다. 의도한 동작이며, 같은 노드를 여러 개 띄울 때 필요하다.

# 8. 정리

- **launch 파일로 여러 노드를 한 번에 띄운다.** `generate_launch_description()`에서 `LaunchDescription`을 반환한다
- launch 파일과 파라미터 파일은 **`setup.py`의 `data_files`에 등록해야** 설치된다
- 파라미터는 **YAML로 분리**하고, 키는 네임스페이스까지 포함한 노드 이름과 맞춰야 한다
- **네임스페이스**로 같은 노드를 여러 개 띄울 수 있다. 토픽 이름에도 접두사가 붙는다
- **launch 인자**로 실행 시점에 값을 바꾼다. `LaunchConfiguration`은 값이 아니라 지연 평가되는 치환 객체다

여기까지가 ROS2로 프로그램을 만드는 기본기다. 4편부터는 로봇다운 주제로 들어간다. 로봇의 각 부위가 어디에 있는지 계산하는 **TF2 좌표 변환**을 다루고, RViz로 눈에 보이게 그린다.

# 9. 참고 자료

- [예제 코드 - kenshin579/tutorials-python](https://github.com/kenshin579/tutorials-python/tree/master/ros2)
- [ROS 2 Tutorials - Creating a launch file](https://docs.ros.org/en/jazzy/Tutorials/Intermediate/Launch/Creating-Launch-Files.html)
- [ROS 2 Tutorials - Using parameters in a class (Python)](https://docs.ros.org/en/jazzy/Tutorials/Beginner-Client-Libraries/Using-Parameters-In-A-Class-Python.html)
- [About parameters in ROS 2](https://docs.ros.org/en/jazzy/Concepts/Basic/About-Parameters.html)
- [Launch file architecture](https://docs.ros.org/en/jazzy/Tutorials/Intermediate/Launch/Launch-file-different-formats.html)
