import CoreLocation
import Foundation
import PenguinsKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: PenguinsCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: PenguinsCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: PenguinsLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: PenguinsLocationGetParams,
        desiredAccuracy: PenguinsLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> PenguinsDeviceStatusPayload
    func info() -> PenguinsDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: PenguinsPhotosLatestParams) async throws -> PenguinsPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: PenguinsContactsSearchParams) async throws -> PenguinsContactsSearchPayload
    func add(params: PenguinsContactsAddParams) async throws -> PenguinsContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: PenguinsCalendarEventsParams) async throws -> PenguinsCalendarEventsPayload
    func add(params: PenguinsCalendarAddParams) async throws -> PenguinsCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: PenguinsRemindersListParams) async throws -> PenguinsRemindersListPayload
    func add(params: PenguinsRemindersAddParams) async throws -> PenguinsRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: PenguinsMotionActivityParams) async throws -> PenguinsMotionActivityPayload
    func pedometer(params: PenguinsPedometerParams) async throws -> PenguinsPedometerPayload
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
