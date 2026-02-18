import Foundation

public enum PenguinsChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(PenguinsChatEventPayload)
    case agent(PenguinsAgentEventPayload)
    case seqGap
}

public protocol PenguinsChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> PenguinsChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [PenguinsChatAttachmentPayload]) async throws -> PenguinsChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> PenguinsChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<PenguinsChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension PenguinsChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "PenguinsChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> PenguinsChatSessionsListResponse {
        throw NSError(
            domain: "PenguinsChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
