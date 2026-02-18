import Foundation

public enum PenguinsLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
