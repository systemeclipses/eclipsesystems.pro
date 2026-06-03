import SwiftUI

struct InvoicesView: View {
    @EnvironmentObject private var store: InvoiceStore
    @State private var showingNewInvoice = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                EclipseHero(
                    eyebrow: "Billing handoff",
                    title: "Turn approved work into cleaner invoices.",
                    message: "This module shows how Eclipse can connect timekeeping to billing workflows, client records, and operational reporting.",
                    systemImage: "doc.text"
                )

                MetricCard(title: "Outstanding invoices", value: store.outstandingTotal.currencyText, systemImage: "exclamationmark.circle.fill", tint: EclipseTheme.primary)

                Button {
                    showingNewInvoice = true
                } label: {
                    Label("New Invoice", systemImage: "plus")
                        .font(.eclipseBody(15, weight: .semibold, relativeTo: .subheadline))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .tint(EclipseTheme.primary)

                EclipseSectionHeader("Client Billing", eyebrow: "Package module", message: "A polished example of invoice status, due dates, and work-to-bill visibility.")
                ForEach(store.invoices) { invoice in
                    NavigationLink(destination: InvoiceDetailView(invoice: invoice)) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(invoice.client).font(.eclipseBody(17, weight: .semibold, relativeTo: .headline))
                                    .foregroundStyle(EclipseTheme.ink)
                                Spacer()
                                StatusPill(title: invoice.status.rawValue, color: invoice.status.color)
                            }
                            HStack {
                                Text(invoice.number)
                                Spacer()
                                Text(invoice.total.currencyText).fontWeight(.semibold)
                            }
                            .font(.eclipseBody(14, relativeTo: .subheadline))
                            .foregroundStyle(EclipseTheme.mutedInk)
                        }
                        .eclipseCard()
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .eclipseScreen()
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showingNewInvoice) {
            NewInvoiceView()
        }
    }
}

struct InvoiceDetailView: View {
    let invoice: Invoice

    var body: some View {
        List {
            Section {
                HStack {
                    VStack(alignment: .leading) {
                        Text(invoice.client).font(.eclipseDisplay(32, relativeTo: .title2))
                        Text(invoice.number).font(.eclipseBody(14, relativeTo: .subheadline)).foregroundStyle(EclipseTheme.mutedInk)
                    }
                    Spacer()
                    StatusPill(title: invoice.status.rawValue, color: invoice.status.color)
                }
                LabeledContent("Due", value: invoice.dueDate.formatted(date: .abbreviated, time: .omitted))
            }

            Section("Line Items") {
                ForEach(invoice.lineItems) { item in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(item.description).font(.eclipseBody(16, weight: .semibold, relativeTo: .headline))
                        HStack {
                            Text("\(item.quantity.formatted(.number.precision(.fractionLength(1)))) x \(item.rate.currencyText)")
                            Spacer()
                            Text(item.total.currencyText).fontWeight(.semibold)
                        }
                        .font(.eclipseBody(14, relativeTo: .subheadline))
                        .foregroundStyle(EclipseTheme.mutedInk)
                    }
                }
            }

            Section {
                HStack {
                    Text("Total").font(.eclipseBody(17, weight: .semibold, relativeTo: .headline))
                    Spacer()
                    Text(invoice.total.currencyText).font(.eclipseDisplay(30, relativeTo: .title2)).foregroundStyle(EclipseTheme.accent)
                }
            }
        }
        .eclipseScreen()
        .navigationTitle("Invoice Detail")
    }
}

struct NewInvoiceView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: InvoiceStore
    @State private var client = ""
    @State private var description = "Custom software sprint"
    @State private var amount = 1500.0

    var body: some View {
        NavigationStack {
            Form {
                TextField("Client", text: $client)
                TextField("Line item", text: $description)
                Section("Amount") {
                    Slider(value: $amount, in: 250...10000, step: 50)
                    Text(amount.currencyText).font(.title3.bold())
                }
            }
            .navigationTitle("New Invoice")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        store.addInvoice(client: client, description: description, amount: amount)
                        dismiss()
                    }
                    .disabled(client.trimmingCharacters(in: .whitespaces).isEmpty || description.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
