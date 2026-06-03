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
        case .draft: .secondary
        case .sent: .blue
        case .paid: .green
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

struct Product: Identifiable {
    let id: UUID
    var name: String
    var category: String
    var price: Double
    var systemImage: String
    var color: Color
    var description: String
}

struct CartItem: Identifiable {
    let id = UUID()
    var product: Product
    var quantity: Int

    var total: Double { product.price * Double(quantity) }
}

struct StoreOrder: Identifiable {
    let id = UUID()
    var customer: String
    var summary: String
    var total: Double
    var date: Date
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
