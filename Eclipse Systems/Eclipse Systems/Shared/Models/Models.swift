import Foundation
import SwiftUI

struct ActivityItem: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let systemImage: String
    let date: Date
}

struct TimeEntry: Identifiable {
    let id: UUID
    var project: String
    var notes: String
    var start: Date
    var end: Date

    var hours: Double {
        max(end.timeIntervalSince(start) / 3600, 0)
    }
}

enum InvoiceStatus: String, CaseIterable, Identifiable {
    case draft = "Draft"
    case sent = "Sent"
    case paid = "Paid"
    case overdue = "Overdue"

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .draft: EclipseTheme.mutedInk
        case .sent: EclipseTheme.secondary
        case .paid: EclipseTheme.primary
        case .overdue: .red
        }
    }
}

struct InvoiceLineItem: Identifiable {
    let id = UUID()
    var description: String
    var quantity: Double
    var rate: Double

    var total: Double { quantity * rate }
}

struct Invoice: Identifiable {
    let id: UUID
    var client: String
    var number: String
    var status: InvoiceStatus
    var dueDate: Date
    var lineItems: [InvoiceLineItem]

    var total: Double {
        lineItems.reduce(0) { $0 + $1.total }
    }
}

struct Lesson: Identifiable {
    let id: UUID
    var title: String
    var minutes: Int
    var isComplete: Bool
}

struct Course: Identifiable {
    let id: UUID
    var title: String
    var summary: String
    var lessons: [Lesson]

    var progress: Double {
        guard !lessons.isEmpty else { return 0 }
        let completeCount = lessons.filter(\.isComplete).count
        return Double(completeCount) / Double(lessons.count)
    }
}

struct ChatChannel: Identifiable {
    let id: UUID
    var name: String
    var systemImage: String
    var description: String
}

struct ChatMessage: Identifiable {
    let id = UUID()
    var channelID: ChatChannel.ID
    var author: String
    var body: String
    var sentAt: Date
    var isCurrentUser: Bool
}

enum ShiftStatus: String, Identifiable {
    case assigned = "Assigned"
    case open = "Open"
    case dropped = "Dropped"

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .assigned: EclipseTheme.primary
        case .open: EclipseTheme.secondary
        case .dropped: .red
        }
    }
}

struct TeamShift: Identifiable {
    let id: UUID
    var role: String
    var location: String
    var startsAt: Date
    var endsAt: Date
    var assignee: String?
    var status: ShiftStatus
    var notes: String

    var timeRangeText: String {
        startsAt.formatted(date: .abbreviated, time: .shortened) + " - " + endsAt.formatted(date: .omitted, time: .shortened)
    }

    var durationHours: Double {
        max(endsAt.timeIntervalSince(startsAt) / 3600, 0)
    }
}

extension Double {
    var currencyText: String {
        self.formatted(.currency(code: "USD"))
    }

    var hoursText: String {
        self.formatted(.number.precision(.fractionLength(1))) + "h"
    }
}

extension Date {
    static func daysAgo(_ days: Int, hour: Int = 9) -> Date {
        var components = Calendar.current.dateComponents([.year, .month, .day], from: .now)
        components.day = (components.day ?? 1) - days
        components.hour = hour
        return Calendar.current.date(from: components) ?? .now
    }
}
