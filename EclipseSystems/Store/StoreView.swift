import SwiftUI

struct StoreView: View {
    @EnvironmentObject private var store: StorefrontStore
    @State private var showingCart = false
    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                architectureBanner

                LazyVGrid(columns: columns, spacing: 14) {
                    ForEach(store.products) { product in
                        NavigationLink(destination: ProductDetailView(product: product)) {
                            ProductCard(product: product)
                        }
                        .buttonStyle(.plain)
                    }
                }

                recentOrders
            }
            .padding()
        }
        .background(EclipseTheme.pageBackground)
        .navigationTitle("Store")
        .toolbar {
            Button {
                showingCart = true
            } label: {
                Label("Cart", systemImage: "cart")
            }
            .badge(store.cartCount)
        }
        .sheet(isPresented: $showingCart) {
            CartView()
        }
    }

    private var architectureBanner: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "info.circle.fill")
                .font(.title2)
                .foregroundStyle(EclipseTheme.accent)
            VStack(alignment: .leading, spacing: 6) {
                Text("Demo architecture note")
                    .font(.headline)
                Text("This storefront is bundled into the demo for convenience. In a real deployment, it ships as a separate customer-facing app from the internal employee workspace, so customer activity never mixes with employee work or internal data.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .eclipseCard()
        .overlay(
            RoundedRectangle(cornerRadius: EclipseTheme.cardRadius, style: .continuous)
                .stroke(EclipseTheme.accent.opacity(0.35), lineWidth: 1)
        )
    }

    private var recentOrders: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Store Orders")
                .font(.headline)
            ForEach(store.recentOrders.prefix(3)) { order in
                HStack {
                    Image(systemName: "shippingbox.fill")
                        .foregroundStyle(EclipseTheme.accent)
                    VStack(alignment: .leading) {
                        Text(order.customer).font(.subheadline.weight(.semibold))
                        Text(order.summary).font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text(order.total.currencyText).font(.subheadline.bold())
                }
            }
        }
        .eclipseCard()
    }
}

struct ProductCard: View {
    let product: Product

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(product.color.opacity(0.16))
                Image(systemName: product.systemImage)
                    .font(.system(size: 42))
                    .foregroundStyle(product.color)
            }
            .frame(height: 120)
            Text(product.name)
                .font(.headline)
            Text(product.category)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(product.price.currencyText)
                .font(.subheadline.bold())
                .foregroundStyle(EclipseTheme.accent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .eclipseCard()
    }
}

struct ProductDetailView: View {
    @EnvironmentObject private var store: StorefrontStore
    let product: Product

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                ZStack {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(product.color.opacity(0.18))
                    Image(systemName: product.systemImage)
                        .font(.system(size: 88))
                        .foregroundStyle(product.color)
                }
                .frame(height: 240)

                VStack(alignment: .leading, spacing: 10) {
                    Text(product.category.uppercased())
                        .font(.caption.weight(.bold))
                        .foregroundStyle(EclipseTheme.accent)
                    Text(product.name)
                        .font(.largeTitle.bold())
                    Text(product.description)
                        .foregroundStyle(.secondary)
                    Text(product.price.currencyText)
                        .font(.title.bold())
                }

                Button {
                    withAnimation { store.addToCart(product) }
                } label: {
                    Label("Add to Cart", systemImage: "cart.badge.plus")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(EclipseTheme.accent)
            }
            .padding()
        }
        .background(EclipseTheme.pageBackground)
        .navigationTitle(product.name)
    }
}

struct CartView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: StorefrontStore

    var body: some View {
        NavigationStack {
            List {
                if store.cart.isEmpty {
                    ContentUnavailableView("Cart is empty", systemImage: "cart", description: Text("Add storefront products to preview checkout."))
                } else {
                    Section("Items") {
                        ForEach(store.cart) { item in
                            HStack(spacing: 12) {
                                Image(systemName: item.product.systemImage)
                                    .foregroundStyle(item.product.color)
                                    .frame(width: 32)
                                VStack(alignment: .leading) {
                                    Text(item.product.name).font(.headline)
                                    Stepper("Qty \(item.quantity)", value: Binding(
                                        get: { item.quantity },
                                        set: { store.updateQuantity(for: item, quantity: $0) }
                                    ), in: 0...20)
                                }
                                Spacer()
                                Text(item.total.currencyText).font(.subheadline.bold())
                            }
                        }
                    }

                    Section {
                        HStack {
                            Text("Total").font(.headline)
                            Spacer()
                            Text(store.cartTotal.currencyText).font(.title2.bold())
                        }
                        Button {
                            store.checkout()
                            dismiss()
                        } label: {
                            Label("Checkout Demo Order", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(EclipseTheme.accent)
                    }
                }
            }
            .navigationTitle("Cart")
            .toolbar { Button("Done") { dismiss() } }
        }
    }
}
