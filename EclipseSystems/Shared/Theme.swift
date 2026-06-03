import SwiftUI

/// Centralized brand styling for the Eclipse Systems demo.
enum EclipseTheme {
    static let accent = Color(red: 0.96, green: 0.63, blue: 0.18)
    static let amberSoft = Color(red: 1.0, green: 0.76, blue: 0.36)
    static let nearBlack = Color(red: 0.04, green: 0.04, blue: 0.055)
    static let cardRadius: CGFloat = 18

    static var pageBackground: Color {
        Color(.systemGroupedBackground)
    }

    static var cardBackground: Color {
        Color(.secondarySystemGroupedBackground)
    }
}

extension View {
    func eclipseCard() -> some View {
        self
            .padding(16)
            .background(EclipseTheme.cardBackground, in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius, style: .continuous))
            .shadow(color: .black.opacity(0.08), radius: 14, y: 6)
    }
}

struct StatusPill: View {
    let title: String
    let color: Color

    var body: some View {
        Text(title)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .foregroundStyle(color)
            .background(color.opacity(0.16), in: Capsule())
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let systemImage: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: systemImage)
                .font(.title2)
                .foregroundStyle(tint)
            Text(value)
                .font(.title2.bold())
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .eclipseCard()
    }
}
