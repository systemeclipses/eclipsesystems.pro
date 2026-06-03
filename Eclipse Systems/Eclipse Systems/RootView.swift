import SwiftUI

enum AppTab: Hashable {
    case dashboard
    case time
    case invoices
    case training
    case team
}

struct RootView: View {
    @StateObject private var timeStore = TimeStore()
    @StateObject private var invoiceStore = InvoiceStore()
    @StateObject private var trainingStore = TrainingStore()
    @StateObject private var teamStore = TeamStore()
    @State private var selectedTab: AppTab = .dashboard

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView(selectedTab: $selectedTab)
            }
            .tabItem { Label("Hub", systemImage: "rectangle.grid.2x2") }
            .tag(AppTab.dashboard)

            NavigationStack {
                TimeView()
            }
            .tabItem { Label("Time", systemImage: "timer") }
            .tag(AppTab.time)

            NavigationStack {
                InvoicesView()
            }
            .tabItem { Label("Billing", systemImage: "doc.text") }
            .tag(AppTab.invoices)

            NavigationStack {
                TrainingView()
            }
            .tabItem { Label("Training", systemImage: "graduationcap") }
            .tag(AppTab.training)

            NavigationStack {
                TeamView()
            }
            .tabItem { Label("Team", systemImage: "message.and.waveform") }
            .badge(teamStore.openShiftCount)
            .tag(AppTab.team)
        }
        .tint(EclipseTheme.accent)
        .font(.eclipseBody(15, relativeTo: .body))
        .environmentObject(timeStore)
        .environmentObject(invoiceStore)
        .environmentObject(trainingStore)
        .environmentObject(teamStore)
    }
}

struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Label("Built by Eclipse Systems", systemImage: "moon.stars.fill")
                    .font(.eclipseDisplay(34, relativeTo: .title))
                    .foregroundStyle(EclipseTheme.accent)

                Text("This package demo shows how Eclipse Systems turns timekeeping, scheduling, approvals, and team communication into polished business software.")
                    .font(.eclipseBody(16, relativeTo: .body))

                Text("The same foundation can be packaged, tailored, or extended into portals, CRM workflows, storefronts, and operations hubs built around how a client actually works.")
                    .font(.eclipseBody(16, relativeTo: .body))

                Link(destination: URL(string: "https://eclipsesystems.pro")!) {
                    Label("Visit eclipsesystems.pro", systemImage: "arrow.up.right.square")
                        .font(.headline)
                }
            }
            .eclipseCard()
            .padding()
        }
        .eclipseScreen()
        .navigationTitle("About")
    }
}
