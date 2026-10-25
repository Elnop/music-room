# Developing on Windows with WSL2

How to get from a fresh Windows + WSL2 machine (Debian 13 trixie, no Windows admin rights) to the app running on a USB phone. The rest of the setup is the one in the [README](../../README.md).

## Docker

Install Docker Desktop on Windows and turn on **Settings › Resources › WSL integration** for your distro. Docker Desktop then shares the WSL2 virtual machine, and its memory (see [Memory](#memory)).

## JDK 17

Debian 13 no longer ships `openjdk-17-jdk`. Take the Temurin 17 archive (Linux x64, `.tar.gz`) from [adoptium.net](https://adoptium.net/temurin/releases/?version=17):

```bash
mkdir -p ~/.jdks && tar -xzf OpenJDK17U-jdk_x64_linux_hotspot_*.tar.gz -C ~/.jdks
ln -sfn ~/.jdks/jdk-17.* ~/.jdks/17
```

In `~/.zshrc`:

```bash
export JAVA_HOME=$HOME/.jdks/17
export PATH=$JAVA_HOME/bin:$PATH
```

## USB phone: the Windows adb

WSL2 does not see USB devices, and `usbipd-win` needs admin rights. The Windows platform-tools need no installation and run from WSL:

1. Unzip [platform-tools-latest-windows.zip](https://dl.google.com/android/repository/platform-tools-latest-windows.zip) into a folder of your Windows profile, e.g. `C:\Users\<you>\platform-tools-win`.
2. Point every make target at it, in `~/.zshrc`:

   ```bash
   export ADB="/mnt/c/Users/<you>/platform-tools-win/platform-tools/adb.exe"
   ```

   Or per command: `make check-devices ADB=/mnt/c/.../adb.exe`.
3. Plug the phone in, unlock it, accept **Allow USB debugging**, then `make check-devices` lists it.
4. `make dev-phone` starts the backend and Metro, forwards them over USB and opens Zumik Dev on the phone.

`adb reverse` then lands on the Windows `localhost`, which WSL2 forwards to its own ports: the phone reaches Metro (8081) and the backend (3000) running in WSL. Use only this adb: a Linux `adb` server started from the SDK in WSL does not see the phone.

`ADB` defaults to `$ANDROID_HOME/platform-tools/adb` (or `adb` from `PATH`); every target that calls adb goes through it.

## Memory

By default WSL2 gets half the Windows RAM and 2 GB of swap, shared with Docker Desktop. On a 16 GB machine, running a native build and `npm run check` together filled it and froze Windows. Measured with the local Supabase stack up (about 730 MB):

| Job | Peak |
| --- | --- |
| `npm run check` in `mobile/` | 2.9 GB (jest uses half the cores: `maxWorkers` in `mobile/package.json`) |
| `npm run check` in `backend/` | 1.2 GB |
| Incremental arm64 debug build (Gradle) | 1.7 GB, and the Gradle and Kotlin daemons keep about 1.8 GB afterwards |

Give WSL2 more room in `C:\Users\<you>\.wslconfig` (no admin rights needed), then run `wsl --shutdown` from Windows:

```ini
[wsl2]
memory=10GB
swap=8GB

[experimental]
autoMemoryReclaim=gradual
```

Bound Gradle in `~/.gradle/gradle.properties`:

```properties
org.gradle.workers.max=4
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
kotlin.daemon.jvmargs=-Xmx1024m
org.gradle.daemon.idletimeout=600000
```

Run one heavy job at a time: never a native build together with `npm run check`. Build only the phone's ABI: `npx expo run:android` does it on its own, a direct `./gradlew` call needs `-PreactNativeArchitectures=arm64-v8a`. `./gradlew --stop` (in `mobile/android/`) frees the daemons right away.

## After `wsl --shutdown` or a Windows restart

Docker Desktop restarts the local Supabase stack on its own, but its published ports can then reset every connection: the backend reports a valid login as `INVALID_CREDENTIALS`. `make supabase-up` (run by every `make dev-*`) checks that the stack's API answers and restarts the stack otherwise, data kept. The backend and Metro containers have no restart policy: they stay stopped until the next `make dev-docker`.

## Emulator (not recommended)

The emulator runs in WSL2 but is slow on a modest machine: prefer the phone. It needs these libraries and the `kvm` group (log in again afterwards):

```bash
sudo apt install libpulse0 libdrm2 libice6 libsm6 libnss3 libnspr4 libpng16-16t64 libxi6 libxkbfile1 libxcb-cursor0 libgl1 libegl1
sudo usermod -aG kvm "$USER"
```
