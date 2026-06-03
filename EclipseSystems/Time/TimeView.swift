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
        List {
            Section {
                VStack(spacing: 16) {
                    Text(store.activeClockIn == nil ? "Ready to clock in" : runningSeconds.formattedTimer)
                        .font(.largeTitle.monospacedDigit().bold())
                    Button(action: store.clockToggle) {
                        Label(store.activeClockIn == nil ? "Clock In" : "Clock Out", systemImage: store.activeClockIn == nil ? "play.fill" : "stop.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(store.activeClockIn == nil ? EclipseTheme.accent : .red)
                    Text("Weekly total: \(store.weeklyTotal.hoursText)")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 8)
            }

            ForEach(groupedEntries, id: \.week) { group in
                Section(group.week) {
                    ForEach(group.entries) { entry in
                        Button {
                            editingEntry = entry
                            showingEditor = true
                        } label: {
                            TimeEntryRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                        .swipeActions {
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
        }
        .navigationTitle("Time")
        .toolbar {
            Button {
                editingEntry = nil
                showingEditor = true
            } label: {
                Label("Add Entry", systemImage: "plus")
            }
        }
        .sheet(isPresented: $showingEditor) {
            TimeEntryEditor(entry: editingEntry)
        }
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { date in
            now = date
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
                Text(entry.project).font(.headline)
                Text(entry.notes).font(.caption).foregroundStyle(.secondary)
                Text("\(entry.start, style: .time) - \(entry.end, style: .time)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(entry.hours.hoursText)
                .font(.headline.monospacedDigit())
                .foregroundStyle(EclipseTheme.accent)
        }
        .padding(.vertical, 4)
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
