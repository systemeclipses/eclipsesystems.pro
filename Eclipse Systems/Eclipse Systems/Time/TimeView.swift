import SwiftUI

struct TimeView: View {
    @EnvironmentObject private var store: TimeStore
    @State private var now = Date()
    @State private var showingEditor = false
    @State private var editingEntry: TimeEntry?

    private var runningSeconds: TimeInterval {
        guard let activeClockIn = store.activeClockIn else { return 0 }
        return now.timeIntervalSince(activeClockIn)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                EclipseHero(
                    eyebrow: "Timekeeping",
                    title: "Capture work without slowing the team down.",
                    message: "A focused example of Eclipse time capture: clock sessions, manual entries, weekly totals, and clean review-ready history.",
                    systemImage: "timer"
                )

                VStack(spacing: 18) {
                    VStack(spacing: 8) {
                        Text(store.activeClockIn == nil ? "Ready to clock in" : runningSeconds.formattedTimer)
                            .font(store.activeClockIn == nil ? .eclipseDisplay(40, relativeTo: .largeTitle) : .system(.largeTitle, design: .monospaced).weight(.bold))
                            .foregroundStyle(EclipseTheme.ink)
                        Text("Weekly total: \(store.weeklyTotal.hoursText)")
                            .font(.eclipseBody(15, weight: .semibold, relativeTo: .headline))
                            .foregroundStyle(EclipseTheme.mutedInk)
                    }

                    Button(action: store.clockToggle) {
                        Label(store.activeClockIn == nil ? "Clock In" : "Clock Out", systemImage: store.activeClockIn == nil ? "play.fill" : "stop.fill")
                            .font(.eclipseBody(16, weight: .semibold, relativeTo: .headline))
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .tint(store.activeClockIn == nil ? EclipseTheme.primary : .red)

                    Button {
                        editingEntry = nil
                        showingEditor = true
                    } label: {
                        Label("Add Entry", systemImage: "plus")
                            .font(.eclipseBody(15, weight: .semibold, relativeTo: .subheadline))
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(EclipseTheme.primary)
                }
                .eclipseCard()

                ForEach(groupedEntries, id: \.week) { group in
                    EclipseSectionHeader(group.week, eyebrow: "Timesheet")
                    ForEach(group.entries) { entry in
                        Button {
                            editingEntry = entry
                            showingEditor = true
                        } label: {
                            TimeEntryRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button(role: .destructive) {
                                if let index = store.entries.firstIndex(where: { $0.id == entry.id }) {
                                    store.entries.remove(at: index)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showingEditor) {
            TimeEntryEditor(entry: editingEntry)
        }
        .eclipseScreen()
        .task {
            while !Task.isCancelled {
                now = .now
                try? await Task.sleep(for: .seconds(1))
            }
        }
    }

    private var groupedEntries: [(week: String, entries: [TimeEntry])] {
        let formatter = DateFormatter()
        formatter.dateFormat = "'Week of' MMM d"
        let grouped = Dictionary(grouping: store.entries) { entry in
            Calendar.current.dateInterval(of: .weekOfYear, for: entry.start)?.start ?? entry.start
        }
        return grouped.keys.sorted(by: >).map { week in
            (formatter.string(from: week), grouped[week, default: []].sorted { $0.start > $1.start })
        }
    }
}

struct TimeEntryRow: View {
    let entry: TimeEntry

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.project).font(.eclipseBody(16, weight: .semibold, relativeTo: .headline))
                Text(entry.notes).font(.eclipseBody(13, relativeTo: .caption)).foregroundStyle(EclipseTheme.mutedInk)
                Text("\(entry.start, style: .time) - \(entry.end, style: .time)")
                    .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption2))
                    .foregroundStyle(EclipseTheme.mutedInk)
            }
            Spacer()
            Text(entry.hours.hoursText)
                .font(.eclipseBody(17, weight: .semibold, relativeTo: .headline).monospacedDigit())
                .foregroundStyle(EclipseTheme.accent)
        }
        .eclipseCard()
    }
}

struct TimeEntryEditor: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: TimeStore
    let entry: TimeEntry?

    @State private var project = ""
    @State private var notes = ""
    @State private var start = Date()
    @State private var end = Date().addingTimeInterval(3600)

    var body: some View {
        NavigationStack {
            Form {
                TextField("Project", text: $project)
                TextField("Notes", text: $notes, axis: .vertical)
                DatePicker("Start", selection: $start)
                DatePicker("End", selection: $end, in: start...)
            }
            .navigationTitle(entry == nil ? "New Entry" : "Edit Entry")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if let entry {
                            store.update(TimeEntry(id: entry.id, project: project, notes: notes, start: start, end: end))
                        } else {
                            store.addEntry(project: project, notes: notes, start: start, end: end)
                        }
                        dismiss()
                    }
                    .disabled(project.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear {
                project = entry?.project ?? "Client Workflow"
                notes = entry?.notes ?? "Implementation work"
                start = entry?.start ?? Date().addingTimeInterval(-3600)
                end = entry?.end ?? Date()
            }
        }
    }
}

private extension TimeInterval {
    var formattedTimer: String {
        let seconds = Int(self)
        return String(format: "%02d:%02d:%02d", seconds / 3600, (seconds / 60) % 60, seconds % 60)
    }
}
