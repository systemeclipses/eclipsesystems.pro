import SwiftUI

struct InvoicesView: View {
    @EnvironmentObject private var store: InvoiceStore
    @State private var showingNewInvoice = false

    var body: some View {
        List {
            Section {
                HStack {
                    Label("Outstanding", systemImage: "exclamationmark.circle.fill")
                        .foregroundStyle(EclipseTheme.accent)
                    Spacer()
                    Text(store.outstandingTotal.currencyText)
                        .font(.title3.bold())
                }
            }

            Section("Invoices") {
                ForEach(store.invoices) { invoice in
                    NavigationLink(destination: InvoiceDetailView(invoice: invoice)) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(invoice.client).font(.headline)
                                Spacer()
                                StatusPill(title: invoice.status.rawValue, color: invoice.status.color)
                            }
                            HStack {
                                Text(invoice.number)
                                Spacer()
                                Text(invoice.total.currencyText).fontWeight(.semibold)
                            }
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 5)
                    }
                }
            }
        }
        .navigationTitle("Invoices")
        .toolbar {
            Button {
                showingNewInvoice = true
            } label: {
                Label("New Invoice", systemImage: "plus")
            }
        }
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
                        Text(invoice.client).font(.title2.bold())
                        Text(invoice.number).foregroundStyle(.secondary)
                    }
                    Spacer()
                    StatusPill(title: invoice.status.rawValue, color: invoice.status.color)
                }
                LabeledContent("Due", value: invoice.dueDate.formatted(date: .abbreviated, time: .omitted))
            }

            Section("Line Items") {
                ForEach(invoice.lineItems) { item in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(item.description).font(.headline)
                        HStack {
                            Text("\(item.quantity.formatted(.number.precision(.fractionLength(1)))) x \(item.rate.currencyText)")
                            Spacer()
                            Text(item.total.currencyText).fontWeight(.semibold)
                        }
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    }
                }
            }

            Section {
                HStack {
                    Text("Total").font(.headline)
                    Spacer()
                    Text(invoice.total.currencyText).font(.title2.bold()).foregroundStyle(EclipseTheme.accent)
                }
            }
        }
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
