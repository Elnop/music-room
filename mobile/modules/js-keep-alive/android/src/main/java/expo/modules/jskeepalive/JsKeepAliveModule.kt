package expo.modules.jskeepalive

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// React Native pauses JS timers (and so fetch, which resolves through setTimeout) once the
// app is in the background, unless a headless JS task is running: this module runs one.
class JsKeepAliveModule : Module() {
  private var taskId: Int? = null

  override fun definition() = ModuleDefinition {
    Name("JsKeepAlive")

    Function("start") {
      UiThreadUtil.runOnUiThread { start() }
    }

    Function("stop") {
      UiThreadUtil.runOnUiThread { stop() }
    }

    OnDestroy {
      UiThreadUtil.runOnUiThread { stop() }
    }
  }

  private fun context(): ReactContext? = appContext.reactContext as? ReactContext

  private fun start() {
    if (taskId != null) return
    val context = context() ?: return
    // No timeout, and allowed while the app is in the foreground: playback starts there.
    val config = HeadlessJsTaskConfig(TASK_KEY, Arguments.createMap(), 0, true)
    taskId = HeadlessJsTaskContext.getInstance(context).startTask(config)
  }

  private fun stop() {
    val id = taskId ?: return
    taskId = null
    val context = context() ?: return
    val tasks = HeadlessJsTaskContext.getInstance(context)
    if (tasks.isTaskRunning(id)) tasks.finishTask(id)
  }

  companion object {
    const val TASK_KEY = "JsKeepAlive"
  }
}
