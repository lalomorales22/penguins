import Foundation

public enum PenguinsRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum PenguinsReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct PenguinsRemindersListParams: Codable, Sendable, Equatable {
    public var status: PenguinsReminderStatusFilter?
    public var limit: Int?

    public init(status: PenguinsReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct PenguinsRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct PenguinsReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct PenguinsRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [PenguinsReminderPayload]

    public init(reminders: [PenguinsReminderPayload]) {
        self.reminders = reminders
    }
}

public struct PenguinsRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: PenguinsReminderPayload

    public init(reminder: PenguinsReminderPayload) {
        self.reminder = reminder
    }
}
