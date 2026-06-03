import SwiftUI

struct DashboardView: View {
    @Binding var selectedTab: AppTab
    @EnvironmentObject private var timeStore: TimeStore
    @EnvironmentObject private var invoiceStore: InvoiceStore
    @EnvironmentObject private var trainingStore: TrainingStore
    @EnvironmentObject private var storefrontStore: StorefrontStore

    private var recentActivity: [ActivityItem] {
        [
            ActivityItem(title: "Invoice sent", subtitle: "Northstar Legal received ES-1048", systemImage: "paperplane.fill", date: .daysAgo(0, hour: 14)),
            ActivityItem(title: "Lesson completed", subtitle: "Client Intake Excellence advanced", systemImage: "checkmark.seal.fill", date: .daysAgo(1, hour: 11)),
            ActivityItem(title: "Store order placed", subtitle: storefrontStore.recentOrders.first?.summary ?? "Workflow Audit", systemImage: "bag.fill", date: .daysAgo(1, hour: 9)),
            ActivityItem(title: "Time captured", subtitle: "Live work turned into a timesheet", systemImage: "clock.fill", date: .daysAgo(2, hour: 16))
        ]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    Button { selectedTab = .time } label: {
                        MetricCard(title: "Hours this week", value: timeStore.weeklyTotal.hoursText, systemImage: "timer", tint: EclipseTheme.accent)
                    }
                    Button { selectedTab = .invoices } label: {
                        MetricCard(title: "Outstanding invoices", value: invoiceStore.outstandingTotal.currencyText, systemImage: "doc.text.fill", tint: .blue)
                    }
                    Button { selectedTab = .training } label: {
                        MetricCard(title: "Training complete", value: trainingStore.completionRate.formatted(.percent.precision(.fractionLength(0))), systemImage: "graduationcap.fill", tint: .green)
                    }
                    Button { selectedTab = .store } label: {
                        MetricCard(title: "Recent orders", value: "\(storefrontStore.recentOrders.count)", systemImage: "bag.fill", tint: .purple)
                    }
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 14) {
                    Text("Recent Activity")
                        .font(.headline)
                    ForEach(recentActivity) { item in
                        HStack(spacing: 12) {
                            Image(systemName: item.systemImage)
                                .foregroundStyle(EclipseTheme.accent)
                                .frame(width: 28)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.title).font(.subheadline.weight(.semibold))
                                Text(item.subtitle).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(item.date, style: .date)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .eclipseCard()
            }
            .padding()
        }
        .background(EclipseTheme.pageBackground)
        .navigationTitle("Eclipse Systems")
        .toolbar {
            NavigationLink(destination: AboutView()) {
                Image(systemName: "info.circle")
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Operations Command Center", systemImage: "moonphase.new.moon.inverse")
                .font(.caption.weight(.semibold))
                .foregroundStyle(EclipseTheme.accent)
            Text("A working demo of internal business tools and a separate customer storefront experience, bundled together for prospect walkthroughs.")
                .font(.title3.weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .eclipseCard()
    }
}
