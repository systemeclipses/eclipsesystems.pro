import SwiftUI

struct TeamView: View {
    @EnvironmentObject private var store: TeamStore
    @State private var selectedMode = TeamMode.chat
    @State private var selectedChannelID: ChatChannel.ID?
    @State private var draftMessage = ""
    @State private var showingNewShift = false

    private var selectedChannel: ChatChannel {
        if let selectedChannelID, let channel = store.channels.first(where: { $0.id == selectedChannelID }) {
            return channel
        }
        return store.channels[0]
    }

    var body: some View {
        ScrollViewReader { proxy in
            VStack(spacing: 0) {
                EclipseHero(
                    eyebrow: "Mission Command",
                    title: "Coordinate coverage where the work happens.",
                    message: "Team chat and shift changes are part of the timekeeping package demo, showing how Eclipse connects schedule operations to daily communication.",
                    systemImage: "message.and.waveform"
                )
                .padding([.horizontal, .top])

                Picker("Mode", selection: $selectedMode) {
                    Label("Chat", systemImage: "message") .tag(TeamMode.chat)
                    Label("Shifts", systemImage: "calendar") .tag(TeamMode.shifts)
                }
                .pickerStyle(.segmented)
                .tint(EclipseTheme.primary)
                .padding()

                if selectedMode == .chat {
                    chatView(proxy: proxy)
                } else {
                    shiftsView
                }
            }
            .eclipseScreen()
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if selectedMode == .shifts {
                    Button {
                        showingNewShift = true
                    } label: {
                        Label("Open Shift", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingNewShift) {
                NewShiftView()
            }
            .onAppear {
                selectedChannelID = selectedChannelID ?? store.channels.first?.id
            }
        }
    }

    private func chatView(proxy: ScrollViewProxy) -> some View {
        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(store.channels) { channel in
                        Button {
                            selectedChannelID = channel.id
                        } label: {
                            Label(channel.name, systemImage: channel.systemImage)
                                .font(.eclipseBody(14, weight: .semibold, relativeTo: .subheadline))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 9)
                                .foregroundStyle(channel.id == selectedChannel.id ? .white : EclipseTheme.primary)
                                .background(channel.id == selectedChannel.id ? EclipseTheme.primary : EclipseTheme.cardBackground, in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
                                .overlay(
                                    RoundedRectangle(cornerRadius: EclipseTheme.cardRadius)
                                        .stroke(EclipseTheme.border, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    channelHeader

                    ForEach(store.messages(for: selectedChannel.id)) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }
                }
                .padding()
            }
            .onChange(of: store.messages.count) {
                if let lastID = store.messages(for: selectedChannel.id).last?.id {
                    withAnimation {
                        proxy.scrollTo(lastID, anchor: .bottom)
                    }
                }
            }

            messageComposer
        }
    }

    private var channelHeader: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: selectedChannel.systemImage)
                .font(.title2)
                .foregroundStyle(EclipseTheme.secondary)
                .frame(width: 36, height: 36)
                .background(EclipseTheme.primary, in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
            VStack(alignment: .leading, spacing: 4) {
                Text(selectedChannel.name)
                    .font(.eclipseDisplay(30, relativeTo: .title3))
                    .foregroundStyle(EclipseTheme.ink)
                Text(selectedChannel.description)
                    .font(.eclipseBody(14, relativeTo: .subheadline))
                    .foregroundStyle(EclipseTheme.mutedInk)
            }
        }
        .eclipseCard()
    }

    private var messageComposer: some View {
        HStack(spacing: 10) {
            TextField("Message \(selectedChannel.name)", text: $draftMessage, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(1...4)

            Button {
                store.sendMessage(draftMessage, channelID: selectedChannel.id)
                draftMessage = ""
            } label: {
                Image(systemName: "paperplane.fill")
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.borderedProminent)
            .tint(EclipseTheme.primary)
            .disabled(draftMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding()
        .background(.thinMaterial)
    }

    private var shiftsView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    ShiftMetricCard(title: "My shifts", value: "\(store.myShiftCount)", systemImage: "person.crop.circle.badge.checkmark")
                    ShiftMetricCard(title: "Open shifts", value: "\(store.openShiftCount)", systemImage: "calendar.badge.exclamationmark")
                }

                VStack(alignment: .leading, spacing: 12) {
                    EclipseSectionHeader("Open Coverage", eyebrow: "Shift marketplace", message: "A clear pickup flow makes schedule gaps visible and actionable.")
                    ForEach(store.shifts.filter { $0.status == .open }) { shift in
                        ShiftRow(shift: shift) {
                            store.claimShift(shift)
                        }
                    }
                }
                .eclipseCard()

                VStack(alignment: .leading, spacing: 12) {
                    EclipseSectionHeader("My Schedule", eyebrow: "Employee view", message: "Team members can drop shifts into coverage without leaving the workspace.")
                    ForEach(store.shifts.filter { $0.assignee == "You" && $0.status == .assigned }) { shift in
                        ShiftRow(shift: shift) {
                            store.dropShift(shift)
                        }
                    }
                }
                .eclipseCard()
            }
            .padding()
        }
    }
}

private enum TeamMode {
    case chat
    case shifts
}

struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.isCurrentUser {
                Spacer(minLength: 42)
            }

            VStack(alignment: message.isCurrentUser ? .trailing : .leading, spacing: 5) {
                HStack {
                    Text(message.author)
                        .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption))
                    Text(message.sentAt, style: .time)
                        .font(.eclipseBody(11, relativeTo: .caption2))
                        .foregroundStyle(EclipseTheme.mutedInk)
                }
                Text(message.body)
                    .font(.eclipseBody(14, relativeTo: .subheadline))
                    .padding(12)
                    .foregroundStyle(message.isCurrentUser ? .white : EclipseTheme.ink)
                    .background(message.isCurrentUser ? EclipseTheme.primary : EclipseTheme.cardBackground, in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
                    .overlay(
                        RoundedRectangle(cornerRadius: EclipseTheme.cardRadius)
                            .stroke(message.isCurrentUser ? .clear : EclipseTheme.border, lineWidth: 1)
                    )
            }

            if !message.isCurrentUser {
                Spacer(minLength: 42)
            }
        }
    }
}

struct ShiftMetricCard: View {
    let title: String
    let value: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .foregroundStyle(EclipseTheme.secondary)
                .frame(width: 34, height: 34)
                .background(EclipseTheme.primary, in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
            VStack(alignment: .leading, spacing: 3) {
                Text(value)
                    .font(.eclipseDisplay(30, relativeTo: .title2))
                    .foregroundStyle(EclipseTheme.ink)
                Text(title)
                    .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption))
                    .foregroundStyle(EclipseTheme.mutedInk)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .eclipseCard()
    }
}

struct ShiftRow: View {
    let shift: TeamShift
    let action: () -> Void

    private var actionTitle: String {
        shift.status == .open ? "Pick Up" : "Drop"
    }

    private var actionImage: String {
        shift.status == .open ? "plus.circle.fill" : "arrow.uturn.backward.circle.fill"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(shift.role)
                        .font(.eclipseBody(16, weight: .semibold, relativeTo: .headline))
                        .foregroundStyle(EclipseTheme.ink)
                    Text(shift.location)
                        .font(.eclipseBody(14, relativeTo: .subheadline))
                        .foregroundStyle(EclipseTheme.mutedInk)
                    Text(shift.timeRangeText)
                        .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption))
                        .foregroundStyle(EclipseTheme.primary)
                }
                Spacer()
                StatusPill(title: shift.status.rawValue, color: shift.status.color)
            }

            Text(shift.notes)
                .font(.eclipseBody(12, relativeTo: .caption))
                .foregroundStyle(EclipseTheme.mutedInk)

            HStack {
                Label(shift.assignee ?? "Unassigned", systemImage: shift.assignee == nil ? "person.crop.circle.badge.questionmark" : "person.crop.circle")
                    .font(.eclipseBody(12, relativeTo: .caption))
                    .foregroundStyle(EclipseTheme.mutedInk)
                Spacer()
                Button(action: action) {
                    Label(actionTitle, systemImage: actionImage)
                }
                .buttonStyle(.borderedProminent)
                .tint(shift.status == .open ? EclipseTheme.primary : .red)
            }
        }
        .padding(12)
        .background(Color.white.opacity(0.6), in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
        .overlay(
            RoundedRectangle(cornerRadius: EclipseTheme.cardRadius)
                .stroke(EclipseTheme.border, lineWidth: 1)
        )
    }
}

struct NewShiftView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: TeamStore
    @State private var role = "Front Desk"
    @State private var location = "North Lobby"
    @State private var startsAt = Date().addingTimeInterval(24 * 60 * 60)
    @State private var endsAt = Date().addingTimeInterval(32 * 60 * 60)
    @State private var notes = "Open for pickup."

    var body: some View {
        NavigationStack {
            Form {
                TextField("Role", text: $role)
                TextField("Location", text: $location)
                DatePicker("Starts", selection: $startsAt)
                DatePicker("Ends", selection: $endsAt, in: startsAt...)
                TextField("Notes", text: $notes, axis: .vertical)
            }
            .navigationTitle("Open Shift")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        store.addOpenShift(role: role, location: location, startsAt: startsAt, endsAt: endsAt, notes: notes)
                        dismiss()
                    }
                    .disabled(role.trimmingCharacters(in: .whitespaces).isEmpty || location.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
