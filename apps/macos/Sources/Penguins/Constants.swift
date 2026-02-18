import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-penguins writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.penguins.mac"
let gatewayLaunchdLabel = "ai.penguins.gateway"
let onboardingVersionKey = "penguins.onboardingVersion"
let onboardingSeenKey = "penguins.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "penguins.pauseEnabled"
let iconAnimationsEnabledKey = "penguins.iconAnimationsEnabled"
let swabbleEnabledKey = "penguins.swabbleEnabled"
let swabbleTriggersKey = "penguins.swabbleTriggers"
let voiceWakeTriggerChimeKey = "penguins.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "penguins.voiceWakeSendChime"
let showDockIconKey = "penguins.showDockIcon"
let defaultVoiceWakeTriggers = ["penguins"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "penguins.voiceWakeMicID"
let voiceWakeMicNameKey = "penguins.voiceWakeMicName"
let voiceWakeLocaleKey = "penguins.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "penguins.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "penguins.voicePushToTalkEnabled"
let talkEnabledKey = "penguins.talkEnabled"
let iconOverrideKey = "penguins.iconOverride"
let connectionModeKey = "penguins.connectionMode"
let remoteTargetKey = "penguins.remoteTarget"
let remoteIdentityKey = "penguins.remoteIdentity"
let remoteProjectRootKey = "penguins.remoteProjectRoot"
let remoteCliPathKey = "penguins.remoteCliPath"
let canvasEnabledKey = "penguins.canvasEnabled"
let cameraEnabledKey = "penguins.cameraEnabled"
let systemRunPolicyKey = "penguins.systemRunPolicy"
let systemRunAllowlistKey = "penguins.systemRunAllowlist"
let systemRunEnabledKey = "penguins.systemRunEnabled"
let locationModeKey = "penguins.locationMode"
let locationPreciseKey = "penguins.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "penguins.peekabooBridgeEnabled"
let deepLinkKeyKey = "penguins.deepLinkKey"
let modelCatalogPathKey = "penguins.modelCatalogPath"
let modelCatalogReloadKey = "penguins.modelCatalogReload"
let cliInstallPromptedVersionKey = "penguins.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "penguins.heartbeatsEnabled"
let debugPaneEnabledKey = "penguins.debugPaneEnabled"
let debugFileLogEnabledKey = "penguins.debug.fileLogEnabled"
let appLogLevelKey = "penguins.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
