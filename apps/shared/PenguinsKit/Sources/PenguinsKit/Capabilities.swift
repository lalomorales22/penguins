import Foundation

public enum PenguinsCapability: String, Codable, Sendable {
    case canvas
    case camera
    case screen
    case voiceWake
    case location
    case device
    case photos
    case contacts
    case calendar
    case reminders
    case motion
}
