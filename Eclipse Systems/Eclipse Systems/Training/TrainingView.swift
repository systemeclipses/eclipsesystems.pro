import SwiftUI

struct TrainingView: View {
    @EnvironmentObject private var store: TrainingStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                EclipseHero(
                    eyebrow: "Enablement",
                    title: "Training that ships with the workflow.",
                    message: "A client-facing proof point: onboarding, policy acknowledgement, and role-specific lessons can live inside the same operating system.",
                    systemImage: "graduationcap"
                )

                VStack(alignment: .leading, spacing: 10) {
                    EclipseSectionHeader("Overall Completion", eyebrow: "Learning path")
                    ProgressView(value: store.completionRate)
                        .tint(EclipseTheme.accent)
                    Text(store.completionRate.formatted(.percent.precision(.fractionLength(0))))
                        .font(.eclipseDisplay(36, relativeTo: .title))
                        .foregroundStyle(EclipseTheme.accent)
                }
                .eclipseCard()

                EclipseSectionHeader("Courses", eyebrow: "Packaged capability", message: "Eclipse can pair new software with the training content teams need to adopt it.")
                ForEach(store.courses) { course in
                    NavigationLink(destination: CourseDetailView(courseID: course.id)) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(course.title).font(.eclipseBody(17, weight: .semibold, relativeTo: .headline))
                                .foregroundStyle(EclipseTheme.ink)
                            Text(course.summary).font(.eclipseBody(13, relativeTo: .caption)).foregroundStyle(EclipseTheme.mutedInk)
                            ProgressView(value: course.progress)
                                .tint(EclipseTheme.accent)
                            Text(course.progress.formatted(.percent.precision(.fractionLength(0))))
                                .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption))
                                .foregroundStyle(EclipseTheme.mutedInk)
                        }
                        .eclipseCard()
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .eclipseScreen()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct CourseDetailView: View {
    @EnvironmentObject private var store: TrainingStore
    let courseID: Course.ID

    private var course: Course? {
        store.courses.first { $0.id == courseID }
    }

    var body: some View {
        List {
            if let course {
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(course.summary)
                            .font(.eclipseBody(15, relativeTo: .body))
                        ProgressView(value: course.progress)
                            .tint(EclipseTheme.accent)
                        Text("\(course.progress.formatted(.percent.precision(.fractionLength(0)))) complete")
                            .font(.eclipseBody(12, weight: .semibold, relativeTo: .caption))
                            .foregroundStyle(EclipseTheme.mutedInk)
                    }
                }

                Section("Lessons") {
                    ForEach(course.lessons) { lesson in
                        Button {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.82)) {
                                store.toggleLesson(courseID: courseID, lessonID: lesson.id)
                            }
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: lesson.isComplete ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(lesson.isComplete ? EclipseTheme.accent : .secondary)
                                VStack(alignment: .leading) {
                                    Text(lesson.title).font(.eclipseBody(16, weight: .semibold, relativeTo: .headline))
                                    Text("\(lesson.minutes) min").font(.eclipseBody(12, relativeTo: .caption)).foregroundStyle(EclipseTheme.mutedInk)
                                }
                                Spacer()
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .eclipseScreen()
        .navigationTitle(course?.title ?? "Course")
    }
}
