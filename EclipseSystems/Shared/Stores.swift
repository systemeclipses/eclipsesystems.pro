import Foundation

@MainActor
final class TimeStore: ObservableObject {
    @Published var entries: [TimeEntry]
    @Published var activeClockIn: Date?

    init() {
        entries = [
            TimeEntry(id: UUID(), project: "Client Portal Refresh", notes: "Dashboard data binding", start: .daysAgo(0, hour: 9), end: .daysAgo(0, hour: 12)),
            TimeEntry(id: UUID(), project: "Invoice Automation", notes: "Payment status workflow", start: .daysAgo(1, hour: 10), end: .daysAgo(1, hour: 15)),
            TimeEntry(id: UUID(), project: "Training Hub", notes: "Lesson progress rules", start: .daysAgo(3, hour: 8), end: .daysAgo(3, hour: 13)),
            TimeEntry(id: UUID(), project: "Storefront Pilot", notes: "Cart interaction polish", start: .daysAgo(6, hour: 11), end: .daysAgo(6, hour: 16))
        ]
    }

    var weeklyTotal: Double {
        entries.filter { Calendar.current.isDate($0.start, equalTo: .now, toGranularity: .weekOfYear) }.reduce(0) { $0 + $1.hours }
    }

    func clockToggle() {
        if let startedAt = activeClockIn {
            entries.insert(TimeEntry(id: UUID(), project: "Eclipse Demo Build", notes: "Live clock session", start: startedAt, end: .now), at: 0)
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
            Course(id: UUID(), title: "Client Intake Excellence", summary: "Learn how Eclipse turns messy intake into repeatable workflows.", lessons: [Lesson(id: UUID(), title: "Qualifying the workflow", minutes: 8, isComplete: true), Lesson(id: UUID(), title: "Mapping approvals", minutes: 12, isComplete: true), Lesson(id: UUID(), title: "Handoff checklist", minutes: 7, isComplete: false)]),
            Course(id: UUID(), title: "Secure Data Practices", summary: "Practical security habits for internal tools and customer apps.", lessons: [Lesson(id: UUID(), title: "Least privilege basics", minutes: 10, isComplete: true), Lesson(id: UUID(), title: "Separating customer data", minutes: 9, isComplete: false), Lesson(id: UUID(), title: "Audit-ready records", minutes: 11, isComplete: false)]),
            Course(id: UUID(), title: "Invoice Operations", summary: "Run billing, approvals, and client communication without spreadsheets.", lessons: [Lesson(id: UUID(), title: "Drafting an invoice", minutes: 6, isComplete: false), Lesson(id: UUID(), title: "Status follow-up", minutes: 8, isComplete: false)])
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
final class StorefrontStore: ObservableObject {
    @Published var products: [Product]
    @Published var cart: [CartItem] = []
    @Published var recentOrders: [StoreOrder]

    init() {
        products = [
            Product(id: UUID(), name: "Workflow Audit", category: "Services", price: 499, systemImage: "doc.text.magnifyingglass", color: .orange, description: "A focused review of one business process with prioritized automation recommendations."),
            Product(id: UUID(), name: "Client Portal Starter", category: "Software", price: 2400, systemImage: "person.2.badge.gearshape", color: .blue, description: "A prototype portal package for intake, messaging, and document visibility."),
            Product(id: UUID(), name: "Training Kit", category: "Enablement", price: 899, systemImage: "graduationcap.fill", color: .purple, description: "A launch-ready internal training bundle for new operational software."),
            Product(id: UUID(), name: "Support Block", category: "Support", price: 1200, systemImage: "wrench.and.screwdriver.fill", color: .green, description: "Ten hours of prioritized product support and improvement work.")
        ]
        recentOrders = [
            StoreOrder(customer: "Morgan Lee", summary: "Workflow Audit", total: 499, date: .daysAgo(1)),
            StoreOrder(customer: "Casey Rivera", summary: "Training Kit + Support Block", total: 2099, date: .daysAgo(3))
        ]
    }

    var cartCount: Int { cart.reduce(0) { $0 + $1.quantity } }
    var cartTotal: Double { cart.reduce(0) { $0 + $1.total } }

    func addToCart(_ product: Product) {
        if let index = cart.firstIndex(where: { $0.product.id == product.id }) {
            cart[index].quantity += 1
        } else {
            cart.append(CartItem(product: product, quantity: 1))
        }
    }

    func updateQuantity(for item: CartItem, quantity: Int) {
        guard let index = cart.firstIndex(where: { $0.id == item.id }) else { return }
        if quantity <= 0 {
            cart.remove(at: index)
        } else {
            cart[index].quantity = quantity
        }
    }

    func checkout() {
        guard !cart.isEmpty else { return }
        recentOrders.insert(StoreOrder(customer: "Demo Customer", summary: cart.map { $0.product.name }.joined(separator: ", "), total: cartTotal, date: .now), at: 0)
        cart.removeAll()
    }
}
