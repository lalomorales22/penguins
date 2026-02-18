package ai.penguins.android.node

import android.os.Build
import ai.penguins.android.BuildConfig
import ai.penguins.android.SecurePrefs
import ai.penguins.android.gateway.GatewayClientInfo
import ai.penguins.android.gateway.GatewayConnectOptions
import ai.penguins.android.gateway.GatewayEndpoint
import ai.penguins.android.gateway.GatewayTlsParams
import ai.penguins.android.protocol.PenguinsCanvasA2UICommand
import ai.penguins.android.protocol.PenguinsCanvasCommand
import ai.penguins.android.protocol.PenguinsCameraCommand
import ai.penguins.android.protocol.PenguinsLocationCommand
import ai.penguins.android.protocol.PenguinsScreenCommand
import ai.penguins.android.protocol.PenguinsSmsCommand
import ai.penguins.android.protocol.PenguinsCapability
import ai.penguins.android.LocationMode
import ai.penguins.android.VoiceWakeMode

class ConnectionManager(
  private val prefs: SecurePrefs,
  private val cameraEnabled: () -> Boolean,
  private val locationMode: () -> LocationMode,
  private val voiceWakeMode: () -> VoiceWakeMode,
  private val smsAvailable: () -> Boolean,
  private val hasRecordAudioPermission: () -> Boolean,
  private val manualTls: () -> Boolean,
) {
  companion object {
    internal fun resolveTlsParamsForEndpoint(
      endpoint: GatewayEndpoint,
      storedFingerprint: String?,
      manualTlsEnabled: Boolean,
    ): GatewayTlsParams? {
      val stableId = endpoint.stableId
      val stored = storedFingerprint?.trim().takeIf { !it.isNullOrEmpty() }
      val isManual = stableId.startsWith("manual|")

      if (isManual) {
        if (!manualTlsEnabled) return null
        if (!stored.isNullOrBlank()) {
          return GatewayTlsParams(
            required = true,
            expectedFingerprint = stored,
            allowTOFU = false,
            stableId = stableId,
          )
        }
        return GatewayTlsParams(
          required = true,
          expectedFingerprint = null,
          allowTOFU = false,
          stableId = stableId,
        )
      }

      // Prefer stored pins. Never let discovery-provided TXT override a stored fingerprint.
      if (!stored.isNullOrBlank()) {
        return GatewayTlsParams(
          required = true,
          expectedFingerprint = stored,
          allowTOFU = false,
          stableId = stableId,
        )
      }

      val hinted = endpoint.tlsEnabled || !endpoint.tlsFingerprintSha256.isNullOrBlank()
      if (hinted) {
        // TXT is unauthenticated. Do not treat the advertised fingerprint as authoritative.
        return GatewayTlsParams(
          required = true,
          expectedFingerprint = null,
          allowTOFU = false,
          stableId = stableId,
        )
      }

      return null
    }
  }

  fun buildInvokeCommands(): List<String> =
    buildList {
      add(PenguinsCanvasCommand.Present.rawValue)
      add(PenguinsCanvasCommand.Hide.rawValue)
      add(PenguinsCanvasCommand.Navigate.rawValue)
      add(PenguinsCanvasCommand.Eval.rawValue)
      add(PenguinsCanvasCommand.Snapshot.rawValue)
      add(PenguinsCanvasA2UICommand.Push.rawValue)
      add(PenguinsCanvasA2UICommand.PushJSONL.rawValue)
      add(PenguinsCanvasA2UICommand.Reset.rawValue)
      add(PenguinsScreenCommand.Record.rawValue)
      if (cameraEnabled()) {
        add(PenguinsCameraCommand.Snap.rawValue)
        add(PenguinsCameraCommand.Clip.rawValue)
      }
      if (locationMode() != LocationMode.Off) {
        add(PenguinsLocationCommand.Get.rawValue)
      }
      if (smsAvailable()) {
        add(PenguinsSmsCommand.Send.rawValue)
      }
      if (BuildConfig.DEBUG) {
        add("debug.logs")
        add("debug.ed25519")
      }
      add("app.update")
    }

  fun buildCapabilities(): List<String> =
    buildList {
      add(PenguinsCapability.Canvas.rawValue)
      add(PenguinsCapability.Screen.rawValue)
      if (cameraEnabled()) add(PenguinsCapability.Camera.rawValue)
      if (smsAvailable()) add(PenguinsCapability.Sms.rawValue)
      if (voiceWakeMode() != VoiceWakeMode.Off && hasRecordAudioPermission()) {
        add(PenguinsCapability.VoiceWake.rawValue)
      }
      if (locationMode() != LocationMode.Off) {
        add(PenguinsCapability.Location.rawValue)
      }
    }

  fun resolvedVersionName(): String {
    val versionName = BuildConfig.VERSION_NAME.trim().ifEmpty { "dev" }
    return if (BuildConfig.DEBUG && !versionName.contains("dev", ignoreCase = true)) {
      "$versionName-dev"
    } else {
      versionName
    }
  }

  fun resolveModelIdentifier(): String? {
    return listOfNotNull(Build.MANUFACTURER, Build.MODEL)
      .joinToString(" ")
      .trim()
      .ifEmpty { null }
  }

  fun buildUserAgent(): String {
    val version = resolvedVersionName()
    val release = Build.VERSION.RELEASE?.trim().orEmpty()
    val releaseLabel = if (release.isEmpty()) "unknown" else release
    return "PenguinsAndroid/$version (Android $releaseLabel; SDK ${Build.VERSION.SDK_INT})"
  }

  fun buildClientInfo(clientId: String, clientMode: String): GatewayClientInfo {
    return GatewayClientInfo(
      id = clientId,
      displayName = prefs.displayName.value,
      version = resolvedVersionName(),
      platform = "android",
      mode = clientMode,
      instanceId = prefs.instanceId.value,
      deviceFamily = "Android",
      modelIdentifier = resolveModelIdentifier(),
    )
  }

  fun buildNodeConnectOptions(): GatewayConnectOptions {
    return GatewayConnectOptions(
      role = "node",
      scopes = emptyList(),
      caps = buildCapabilities(),
      commands = buildInvokeCommands(),
      permissions = emptyMap(),
      client = buildClientInfo(clientId = "penguins-android", clientMode = "node"),
      userAgent = buildUserAgent(),
    )
  }

  fun buildOperatorConnectOptions(): GatewayConnectOptions {
    return GatewayConnectOptions(
      role = "operator",
      scopes = listOf("operator.read", "operator.write", "operator.talk.secrets"),
      caps = emptyList(),
      commands = emptyList(),
      permissions = emptyMap(),
      client = buildClientInfo(clientId = "penguins-control-ui", clientMode = "ui"),
      userAgent = buildUserAgent(),
    )
  }

  fun resolveTlsParams(endpoint: GatewayEndpoint): GatewayTlsParams? {
    val stored = prefs.loadGatewayTlsFingerprint(endpoint.stableId)
    return resolveTlsParamsForEndpoint(endpoint, storedFingerprint = stored, manualTlsEnabled = manualTls())
  }
}
