import Foundation

public enum PenguinsCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum PenguinsCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum PenguinsCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum PenguinsCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct PenguinsCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: PenguinsCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: PenguinsCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: PenguinsCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: PenguinsCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct PenguinsCameraClipParams: Codable, Sendable, Equatable {
    public var facing: PenguinsCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: PenguinsCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: PenguinsCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: PenguinsCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
