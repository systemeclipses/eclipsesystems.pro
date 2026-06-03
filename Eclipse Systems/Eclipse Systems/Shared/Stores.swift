import Foundation
import Combine
import SwiftUI

@MainActor
final class TimeStore: ObservableObject {
    @Published var entries: [TimeEntry]
    @Published var activeClockIn: Date?

    init() {
        entries = [
            TimeEntry(id: UUID(), project: "Operations Hub", notes: "Coverage dashboard and shift review", start: .daysAgo(0, hour: 9), end: .daysAgo(0, hour: 12)),
            TimeEntry(id: UUID(), project: "Client Portal", notes: "Approval workflow and billing handoff", start: .daysAgo(1, hour: 10), end: .daysAgo(1, hour: 15)),
            TimeEntry(id: UUID(), project: "Training System", notes: "Onboarding lesson progress rules", start: .daysAgo(3, hour: 8), end: .daysAgo(3, hour: 13)),
            TimeEntry(id: UUID(), project: "CRM & Sales Pipeline", notes: "Activity timeline and account notes", start: .daysAgo(6, hour: 11), end: .daysAgo(6, hour: 16))
        ]
    }

    var weeklyTotal: Double {
        entries.filter { Calendar.current.isDate($0.start, equalTo: .now, toGranularity: .weekOfYear) }.reduce(0) { $0 + $1.hours }
    }

    func clockToggle() {
        if let startedAt = activeClockIn {
            entries.insert(TimeEntry(id: UUID(), project: "Eclipse Timekeeping", notes: "Live clock session", start: startedAt, end: .now), at: 0)
            activeClockIn = nil
        } else {
            activeClockIn = .now
        }
    }

    func addEntry(project: String, notes: String, start: Date, end: Date) {
        entries.insert(TimeEntry(id: UUID(), project: project, notes: notes, start: start, end: end), at: 0)
    }

    func update(_ entry: TimeEntry) {
        guard let index = entries.firstIndex(where: { $0.id == entry.id }) else { return }
        entries[index] = entry
    }

    func delete(at offsets: IndexSet) {
        entries.remove(atOffsets: offsets)
    }
}

@MainActor
final class InvoiceStore: ObservableObject {
    @Published var invoices: [Invoice]

    init() {
        invoices = [
            Invoice(id: UUID(), client: "Northstar Legal", number: "ES-1048", status: .sent, dueDate: .daysAgo(-7), lineItems: [InvoiceLineItem(description: "Case dashboard module", quantity: 18, rate: 165), InvoiceLineItem(description: "QA and launch support", quantity: 6, rate: 145)]),
            Invoice(id: UUID(), client: "Brightline Supply", number: "ES-1047", status: .overdue, dueDate: .daysAgo(5), lineItems: [InvoiceLineItem(description: "Inventory workflow", quantity: 24, rate: 155)]),
            Invoice(id: UUID(), client: "Helio Fitness", number: "ES-1046", status: .paid, dueDate: .daysAgo(10), lineItems: [InvoiceLineItem(description: "Member portal sprint", quantity: 32, rate: 150)]),
            Invoice(id: UUID(), client: "Aster Academy", number: "ES-1045", status: .draft, dueDate: .daysAgo(-14), lineItems: [InvoiceLineItem(description: "Training app prototype", quantity: 12, rate: 160)])
        ]
    }

    var outstandingTotal: Double {
        invoices.filter { $0.status == .sent || $0.status == .overdue }.reduce(0) { $0 + $1.total }
    }

    func addInvoice(client: String, description: String, amount: Double) {
        let nextNumber = "ES-" + String(1049 + invoices.count)
        invoices.insert(Invoice(id: UUID(), client: client, number: nextNumber, status: .draft, dueDate: .daysAgo(-14), lineItems: [InvoiceLineItem(description: description, quantity: 1, rate: amount)]), at: 0)
    }
}

@MainActor
final class TrainingStore: ObservableObject {
    @Published var courses: [Course]

    init() {
        courses = [
            Course(id: UUID(), title: "Timekeeping Rollout", summary: "Show managers how Eclipse captures time, flags exceptions, and keeps approvals moving.", lessons: [Lesson(id: UUID(), title: "Clocking into the right shift", minutes: 8, isComplete: true), Lesson(id: UUID(), title: "Reviewing weekly approvals", minutes: 12, isComplete: true), Lesson(id: UUID(), title: "Handoff to payroll", minutes: 7, isComplete: false)]),
            Course(id: UUID(), title: "Secure Operations", summary: "Practical habits for permissions, audit history, and clean employee data.", lessons: [Lesson(id: UUID(), title: "Least privilege basics", minutes: 10, isComplete: true), Lesson(id: UUID(), title: "Separating employee records", minutes: 9, isComplete: false), Lesson(id: UUID(), title: "Audit-ready changes", minutes: 11, isComplete: false)]),
            Course(id: UUID(), title: "Manager Workflow", summary: "Coordinate scheduling, coverage, and billing without spreadsheet handoffs.", lessons: [Lesson(id: UUID(), title: "Approving time", minutes: 6, isComplete: false), Lesson(id: UUID(), title: "Resolving coverage gaps", minutes: 8, isComplete: false)])
        ]
    }

    var completionRate: Double {
        let lessons = courses.flatMap(\.lessons)
        guard !lessons.isEmpty else { return 0 }
        return Double(lessons.filter(\.isComplete).count) / Double(lessons.count)
    }

    func toggleLesson(courseID: Course.ID, lessonID: Lesson.ID) {
        guard let courseIndex = courses.firstIndex(where: { $0.id == courseID }), let lessonIndex = courses[courseIndex].lessons.firstIndex(where: { $0.id == lessonID }) else { return }
        courses[courseIndex].lessons[lessonIndex].isComplete.toggle()
    }
}

@MainActor
final class TeamStore: ObservableObject {
    @Published var channels: [ChatChannel]
    @Published var messages: [ChatMessage]
    @Published var shifts: [TeamShift]

    init() {
        let operationsID = UUID()
        let handoffID = UUID()
        let coverageID = UUID()

        channels = [
            ChatChannel(id: operationsID, name: "Operations", systemImage: "radio", description: "Live coordination for today's floor plan."),
            ChatChannel(id: handoffID, name: "Handoff", systemImage: "arrow.left.arrow.right", description: "Shift notes, blockers, and closeout updates."),
            ChatChannel(id: coverageID, name: "Coverage", systemImage: "person.2.badge.gearshape", description: "Open shifts, swaps, and schedule changes.")
        ]

        messages = [
            ChatMessage(channelID: operationsID, author: "Morgan Lee", body: "North lobby is covered. Moving one person to intake until 2 PM.", sentAt: .daysAgo(0, hour: 9), isCurrentUser: false),
            ChatMessage(channelID: operationsID, author: "You", body: "I can take intake after my billing block wraps.", sentAt: .daysAgo(0, hour: 10), isCurrentUser: true),
            ChatMessage(channelID: handoffID, author: "Casey Rivera", body: "Training room projector is checked out and ready for the 3 PM onboarding group.", sentAt: .daysAgo(0, hour: 11), isCurrentUser: false),
            ChatMessage(channelID: coverageID, author: "Riley Chen", body: "Dropped Friday close. Need coverage for front desk.", sentAt: .daysAgo(0, hour: 12), isCurrentUser: false)
        ]

        shifts = [
            TeamShift(id: UUID(), role: "Front Desk", location: "North Lobby", startsAt: .daysAgo(-1, hour: 8), endsAt: .daysAgo(-1, hour: 14), assignee: "You", status: .assigned, notes: "Open the lobby and handle morning intake."),
            TeamShift(id: UUID(), role: "Client Intake", location: "Suite 204", startsAt: .daysAgo(-2, hour: 12), endsAt: .daysAgo(-2, hour: 18), assignee: nil, status: .open, notes: "Needs someone certified on intake workflow."),
            TeamShift(id: UUID(), role: "Training Support", location: "Training Room", startsAt: .daysAgo(-3, hour: 14), endsAt: .daysAgo(-3, hour: 19), assignee: "Morgan Lee", status: .assigned, notes: "Help new hires through onboarding checklist."),
            TeamShift(id: UUID(), role: "Closing Lead", location: "South Desk", startsAt: .daysAgo(-4, hour: 16), endsAt: .daysAgo(-4, hour: 22), assignee: nil, status: .open, notes: "Dropped by Riley. Requires keyholder approval.")
        ]
    }

    var openShiftCount: Int {
        shifts.filter { $0.status == .open }.count
    }

    var myShiftCount: Int {
        shifts.filter { $0.assignee == "You" && $0.status == .assigned }.count
    }

    func messages(for channelID: ChatChannel.ID) -> [ChatMessage] {
        messages
            .filter { $0.channelID == channelID }
            .sorted { $0.sentAt < $1.sentAt }
    }

    func sendMessage(_ body: String, channelID: ChatChannel.ID) {
        let trimmedBody = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedBody.isEmpty else { return }
        messages.append(ChatMessage(channelID: channelID, author: "You", body: trimmedBody, sentAt: .now, isCurrentUser: true))
    }

    func claimShift(_ shift: TeamShift) {
        guard let index = shifts.firstIndex(where: { $0.id == shift.id }) else { return }
        shifts[index].assignee = "You"
        shifts[index].status = .assigned
        messages.append(ChatMessage(channelID: channels.last?.id ?? channels[0].id, author: "You", body: "Picked up \(shift.role) at \(shift.location).", sentAt: .now, isCurrentUser: true))
    }

    func dropShift(_ shift: TeamShift) {
        guard let index = shifts.firstIndex(where: { $0.id == shift.id }) else { return }
        shifts[index].assignee = nil
        shifts[index].status = .open
        messages.append(ChatMessage(channelID: channels.last?.id ?? channels[0].id, author: "You", body: "Dropped \(shift.role). It is open for coverage.", sentAt: .now, isCurrentUser: true))
    }

    func addOpenShift(role: String, location: String, startsAt: Date, endsAt: Date, notes: String) {
        shifts.insert(TeamShift(id: UUID(), role: role, location: location, startsAt: startsAt, endsAt: endsAt, assignee: nil, status: .open, notes: notes), at: 0)
    }
}
