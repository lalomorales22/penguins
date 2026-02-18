import Foundation

public enum PenguinsDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum PenguinsBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum PenguinsThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum PenguinsNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum PenguinsNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct PenguinsBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: PenguinsBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: PenguinsBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct PenguinsThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: PenguinsThermalState

    public init(state: PenguinsThermalState) {
        self.state = state
    }
}

public struct PenguinsStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct PenguinsNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: PenguinsNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [PenguinsNetworkInterfaceType]

    public init(
        status: PenguinsNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [PenguinsNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct PenguinsDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: PenguinsBatteryStatusPayload
    public var thermal: PenguinsThermalStatusPayload
    public var storage: PenguinsStorageStatusPayload
    public var network: PenguinsNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: PenguinsBatteryStatusPayload,
        thermal: PenguinsThermalStatusPayload,
        storage: PenguinsStorageStatusPayload,
        network: PenguinsNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct PenguinsDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
