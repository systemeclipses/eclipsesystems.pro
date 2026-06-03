import SwiftUI

enum AppTab: Hashable {
    case dashboard
    case time
    case invoices
    case training
    case store
}

struct RootView: View {
    @StateObject private var timeStore = TimeStore()
    @StateObject private var invoiceStore = InvoiceStore()
    @StateObject private var trainingStore = TrainingStore()
    @StateObject private var storefrontStore = StorefrontStore()
    @State private var selectedTab: AppTab = .dashboard

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView(selectedTab: $selectedTab)
            }
            .tabItem { Label("Dashboard", systemImage: "chart.bar.xaxis") }
            .tag(AppTab.dashboard)

            NavigationStack {
                TimeView()
            }
            .tabItem { Label("Time", systemImage: "timer") }
            .tag(AppTab.time)

            NavigationStack {
                InvoicesView()
            }
            .tabItem { Label("Invoices", systemImage: "doc.text") }
            .tag(AppTab.invoices)

            NavigationStack {
                TrainingView()
            }
            .tabItem { Label("Training", systemImage: "graduationcap") }
            .tag(AppTab.training)

            NavigationStack {
                StoreView()
            }
            .tabItem { Label("Store", systemImage: "bag") }
            .badge(storefrontStore.cartCount)
            .tag(AppTab.store)
        }
        .tint(EclipseTheme.accent)
        .environmentObject(timeStore)
        .environmentObject(invoiceStore)
        .environmentObject(trainingStore)
        .environmentObject(storefrontStore)
    }
}

struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Label("Built by Eclipse Systems", systemImage: "moon.stars.fill")
                    .font(.title.bold())
                    .foregroundStyle(EclipseTheme.accent)

                Text("This demo shows the kind of custom business software Eclipse Systems builds: internal workspaces, operational dashboards, billing tools, training flows, and customer storefronts.")

                Text("For real clients, the internal workspace and customer storefront ship as separate apps. That keeps employee workflows, permissions, and internal data fully isolated from customer activity.")

                Link(destination: URL(string: "https://eclipsesystems.pro")!) {
                    Label("Visit eclipsesystems.pro", systemImage: "arrow.up.right.square")
                        .font(.headline)
                }
            }
            .eclipseCard()
            .padding()
        }
        .background(EclipseTheme.pageBackground)
        .navigationTitle("About")
    }
}
