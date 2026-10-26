package expo.modules.beaconadvertiser

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Broadcasts one non-connectable advertisement holding the manufacturer data given by JS.
// The iBeacon frame (UUID, major, minor, measured power) is built in TypeScript.
class BeaconAdvertiserModule : Module() {
  private var callback: AdvertiseCallback? = null

  override fun definition() = ModuleDefinition {
    Name("BeaconAdvertiser")

    // "unsupported" (no BLE advertising on this phone), "off" (Bluetooth disabled) or "on".
    Function("getState") {
      val adapter = adapter() ?: return@Function "unsupported"
      if (!adapter.isEnabled) return@Function "off"
      if (!adapter.isMultipleAdvertisementSupported || adapter.bluetoothLeAdvertiser == null) {
        return@Function "unsupported"
      }
      "on"
    }

    AsyncFunction("start") { manufacturerId: Int, data: List<Int>, promise: Promise ->
      start(manufacturerId, ByteArray(data.size) { data[it].toByte() }, promise)
    }

    Function("stop") {
      stop()
    }

    OnDestroy {
      stop()
    }
  }

  private fun adapter(): BluetoothAdapter? {
    val context = appContext.reactContext ?: return null
    val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    return manager?.adapter
  }

  // BLUETOOTH_ADVERTISE is requested by JS before start; a SecurityException rejects the promise.
  @SuppressLint("MissingPermission")
  private fun start(manufacturerId: Int, payload: ByteArray, promise: Promise) {
    stop()
    val advertiser = adapter()?.takeIf { it.isEnabled }?.bluetoothLeAdvertiser
    if (advertiser == null) {
      promise.reject(CodedException("BLUETOOTH_UNAVAILABLE", "Bluetooth is off or cannot advertise", null))
      return
    }
    val settings = AdvertiseSettings.Builder()
      .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
      .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
      .setConnectable(false)
      .setTimeout(0)
      .build()
    val data = AdvertiseData.Builder()
      .setIncludeDeviceName(false)
      .setIncludeTxPowerLevel(false)
      .addManufacturerData(manufacturerId, payload)
      .build()
    val started = object : AdvertiseCallback() {
      override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
        promise.resolve(null)
      }

      override fun onStartFailure(errorCode: Int) {
        if (callback === this) callback = null
        promise.reject(CodedException("ADVERTISE_FAILED_$errorCode", "Advertising failed ($errorCode)", null))
      }
    }
    callback = started
    try {
      advertiser.startAdvertising(settings, data, started)
    } catch (error: SecurityException) {
      callback = null
      promise.reject(CodedException("PERMISSION_DENIED", "BLUETOOTH_ADVERTISE is not granted", error))
    }
  }

  @SuppressLint("MissingPermission")
  private fun stop() {
    val current = callback ?: return
    callback = null
    try {
      adapter()?.bluetoothLeAdvertiser?.stopAdvertising(current)
    } catch (_: SecurityException) {
      // Permission revoked while advertising: Android has already stopped it.
    }
  }
}
