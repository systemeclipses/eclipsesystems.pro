import SwiftUI

struct DashboardView: View {
    @Binding var selectedTab: AppTab
    @EnvironmentObject private var timeStore: TimeStore
    @EnvironmentObject private var invoiceStore: InvoiceStore
    @EnvironmentObject private var trainingStore: TrainingStore
    @EnvironmentObject private var teamStore: TeamStore

    private var recentActivity: [ActivityItem] {
        [
            ActivityItem(title: "Invoice sent", subtitle: "Northstar Legal received ES-1048", systemImage: "paperplane.fill", date: .daysAgo(0, hour: 14)),
            ActivityItem(title: "Lesson completed", subtitle: "Client Intake Excellence advanced", systemImage: "checkmark.seal.fill", date: .daysAgo(1, hour: 11)),
            ActivityItem(title: "Shift opened", subtitle: "\(teamStore.openShiftCount) shifts need coverage", systemImage: "calendar.badge.exclamationmark", date: .daysAgo(1, hour: 9)),
            ActivityItem(title: "Time captured", subtitle: "Live work turned into a timesheet", systemImage: "clock.fill", date: .daysAgo(2, hour: 16))
        ]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    Button { selectedTab = .time } label: {
                        MetricCard(title: "Hours this week", value: timeStore.weeklyTotal.hoursText, systemImage: "timer", tint: EclipseTheme.primary)
                    }
                    Button { selectedTab = .invoices } label: {
                        MetricCard(title: "Outstanding invoices", value: invoiceStore.outstandingTotal.currencyText, systemImage: "doc.text.fill", tint: EclipseTheme.secondary)
                    }
                    Button { selectedTab = .training } label: {
                        MetricCard(title: "Training complete", value: trainingStore.completionRate.formatted(.percent.precision(.fractionLength(0))), systemImage: "graduationcap.fill", tint: EclipseTheme.primary)
                    }
                    Button { selectedTab = .team } label: {
                        MetricCard(title: "Open shifts", value: "\(teamStore.openShiftCount)", systemImage: "message.and.waveform.fill", tint: EclipseTheme.secondary)
                    }
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 14) {
                    EclipseSectionHeader("Proof in Motion", eyebrow: "Operations Hub", message: "A compact snapshot of the systems Eclipse can build, package, or tailor for a working team.")
                    ForEach(recentActivity) { item in
                        HStack(spacing: 12) {
                            Image(systemName: item.systemImage)
                                .foregroundStyle(EclipseTheme.accent)
                                .frame(width: 34, height: 34)
                                .background(EclipseTheme.primary.opacity(0.12), in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.title).font(.eclipseBody(15, weight: .semibold, relativeTo: .subheadline))
                                Text(item.subtitle).font(.eclipseBody(12, relativeTo: .caption)).foregroundStyle(EclipseTheme.mutedInk)
                            }
                            Spacer()
                            Text(item.date, style: .date)
                                .font(.eclipseBody(11, relativeTo: .caption2))
                                .foregroundStyle(EclipseTheme.mutedInk)
                        }
                    }
                }
                .eclipseCard()
            }
            .padding()
        }
        .eclipseScreen()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var header: some View {
        EclipseHero(
            eyebrow: "Timekeeping package demo",
            title: "Custom software built around your business.",
            message: "A working demo of the systems Eclipse can build, package, or tailor: time capture, approvals, billing handoff, training, team chat, and shift coverage.",
            systemImage: "moonphase.new.moon.inverse"
        )
        .overlay(alignment: .topTrailing) {
            NavigationLink(destination: AboutView()) {
                Image(systemName: "info.circle")
                    .font(.headline)
                    .foregroundStyle(EclipseTheme.primaryDeep)
                    .frame(width: 34, height: 34)
                    .background(EclipseTheme.creamSoft, in: Circle())
                    .shadow(color: .black.opacity(0.12), radius: 10, y: 4)
            }
            .padding(14)
        }
    }
}
