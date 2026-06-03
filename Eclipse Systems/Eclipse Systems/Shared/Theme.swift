import CoreText
import SwiftUI
import UIKit

enum EclipseTheme {
    static let primary = Color(light: UIColor(red: 0.27, green: 0.37, blue: 0.30, alpha: 1), dark: UIColor(red: 0.53, green: 0.66, blue: 0.55, alpha: 1))
    static let primaryDeep = Color(light: UIColor(red: 0.13, green: 0.20, blue: 0.15, alpha: 1), dark: UIColor(red: 0.06, green: 0.10, blue: 0.08, alpha: 1))
    static let secondary = Color(light: UIColor(red: 0.70, green: 0.76, blue: 0.53, alpha: 1), dark: UIColor(red: 0.77, green: 0.82, blue: 0.60, alpha: 1))
    static let cream = Color(light: UIColor(red: 0.97, green: 0.91, blue: 0.82, alpha: 1), dark: UIColor(red: 0.08, green: 0.12, blue: 0.09, alpha: 1))
    static let creamSoft = Color(light: UIColor(red: 0.99, green: 0.96, blue: 0.90, alpha: 1), dark: UIColor(red: 0.10, green: 0.15, blue: 0.11, alpha: 1))
    static let ink = Color(light: UIColor(red: 0.10, green: 0.15, blue: 0.12, alpha: 1), dark: UIColor(red: 0.94, green: 0.90, blue: 0.82, alpha: 1))
    static let mutedInk = Color(light: UIColor(red: 0.33, green: 0.41, blue: 0.35, alpha: 1), dark: UIColor(red: 0.72, green: 0.78, blue: 0.70, alpha: 1))
    static let border = Color(light: UIColor(red: 0.82, green: 0.76, blue: 0.67, alpha: 1), dark: UIColor(red: 0.23, green: 0.31, blue: 0.25, alpha: 1))
    static let surface = Color(light: UIColor(white: 1, alpha: 0.68), dark: UIColor(red: 0.12, green: 0.18, blue: 0.14, alpha: 0.92))
    static let accent = primary
    static let cardRadius: CGFloat = 8
    static let panelRadius: CGFloat = 12

    static var pageBackground: Color {
        cream
    }

    static var cardBackground: Color {
        surface
    }

    static func registerFonts() {
        let subdirectories = ["Fonts", "Resources/Fonts"]
        let urls = (Bundle.main.urls(forResourcesWithExtension: "otf", subdirectory: nil) ?? [])
            + subdirectories.flatMap { Bundle.main.urls(forResourcesWithExtension: "otf", subdirectory: $0) ?? [] }
        urls.forEach { url in
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }

        [
            "SeatrenFont",
            "HelvenaRegularFont",
            "HelvenaMediumFont",
            "HelvenaSemiboldFont",
            "HelvenaBoldFont"
        ].forEach { assetName in
            guard let data = NSDataAsset(name: assetName)?.data else { return }
            registerFont(data)
        }
    }

    private static func registerFont(_ data: Data) {
        let descriptors = CTFontManagerCreateFontDescriptorsFromData(data as CFData)
        CTFontManagerRegisterFontDescriptors(descriptors, .process, true) { _, _ in
            true
        }
    }
}

extension Color {
    init(light: UIColor, dark: UIColor) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}

extension Font {
    static func eclipseDisplay(_ size: CGFloat, relativeTo textStyle: TextStyle = .largeTitle) -> Font {
        .custom("Seatren", size: size, relativeTo: textStyle)
    }

    static func eclipseBody(_ size: CGFloat, weight: Weight = .regular, relativeTo textStyle: TextStyle = .body) -> Font {
        let name: String
        switch weight {
        case .bold, .heavy, .black:
            name = "Helvena-Bd"
        case .semibold:
            name = "Helvena-SmBd"
        case .medium:
            name = "Helvena-Md"
        default:
            name = "Helvena-Rg"
        }
        return .custom(name, size: size, relativeTo: textStyle)
    }
}

extension View {
    func eclipseCard() -> some View {
        self
            .padding(16)
            .background(EclipseTheme.cardBackground, in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
            .overlay(
                RoundedRectangle(cornerRadius: EclipseTheme.cardRadius)
                    .stroke(EclipseTheme.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.06), radius: 14, y: 6)
    }

    func eclipseScreen() -> some View {
        self
            .background(EclipseTheme.pageBackground)
            .scrollContentBackground(.hidden)
    }
}

struct StatusPill: View {
    let title: String
    let color: Color

    var body: some View {
        Text(title)
            .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption))
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
                .frame(width: 34, height: 34)
                .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: EclipseTheme.cardRadius))
            Text(value)
                .font(.eclipseDisplay(30, relativeTo: .title))
                .foregroundStyle(EclipseTheme.ink)
            Text(title)
                .font(.eclipseBody(13, weight: .semibold, relativeTo: .caption))
                .foregroundStyle(EclipseTheme.mutedInk)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .eclipseCard()
    }
}

struct EclipseHero: View {
    let eyebrow: String
    let title: String
    let message: String
    let systemImage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Label(eyebrow, systemImage: systemImage)
                    .font(.eclipseBody(13, weight: .semibold, relativeTo: .caption))
                    .foregroundStyle(EclipseTheme.secondary)
                Spacer()
                Text("Eclipse Systems")
                    .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption))
                    .foregroundStyle(.white.opacity(0.72))
            }

            Text(title)
                .font(.eclipseDisplay(48, relativeTo: .largeTitle))
                .lineSpacing(1)
                .foregroundStyle(EclipseTheme.creamSoft)
                .minimumScaleFactor(0.82)

            Text(message)
                .font(.eclipseBody(16, relativeTo: .body))
                .lineSpacing(4)
                .foregroundStyle(.white.opacity(0.78))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(24)
        .background {
            ZStack(alignment: .bottomTrailing) {
                EclipseTheme.primaryDeep
                Circle()
                    .stroke(EclipseTheme.secondary.opacity(0.28), lineWidth: 18)
                    .frame(width: 150, height: 150)
                    .offset(x: 52, y: 52)
                Circle()
                    .fill(EclipseTheme.primary.opacity(0.48))
                    .frame(width: 86, height: 86)
                    .offset(x: 20, y: 20)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: EclipseTheme.panelRadius))
        .shadow(color: .black.opacity(0.14), radius: 18, y: 8)
    }
}

struct EclipseSectionHeader: View {
    let eyebrow: String?
    let title: String
    let message: String?

    init(_ title: String, eyebrow: String? = nil, message: String? = nil) {
        self.title = title
        self.eyebrow = eyebrow
        self.message = message
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let eyebrow {
                Text(eyebrow.uppercased())
                    .font(.eclipseBody(11, weight: .semibold, relativeTo: .caption))
                    .foregroundStyle(EclipseTheme.primary)
            }
            Text(title)
                .font(.eclipseDisplay(30, relativeTo: .title2))
                .foregroundStyle(EclipseTheme.ink)
            if let message {
                Text(message)
                    .font(.eclipseBody(14, relativeTo: .subheadline))
                    .foregroundStyle(EclipseTheme.mutedInk)
            }
        }
    }
}
