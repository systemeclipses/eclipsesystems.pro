import SwiftUI

struct TrainingView: View {
    @EnvironmentObject private var store: TrainingStore

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Overall Completion")
                        .font(.headline)
                    ProgressView(value: store.completionRate)
                        .tint(EclipseTheme.accent)
                    Text(store.completionRate.formatted(.percent.precision(.fractionLength(0))))
                        .font(.title.bold())
                        .foregroundStyle(EclipseTheme.accent)
                }
                .padding(.vertical, 6)
            }

            Section("Courses") {
                ForEach(store.courses) { course in
                    NavigationLink(destination: CourseDetailView(courseID: course.id)) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(course.title).font(.headline)
                            Text(course.summary).font(.caption).foregroundStyle(.secondary)
                            ProgressView(value: course.progress)
                                .tint(EclipseTheme.accent)
                            Text(course.progress.formatted(.percent.precision(.fractionLength(0))))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 5)
                    }
                }
            }
        }
        .navigationTitle("Training")
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
                        ProgressView(value: course.progress)
                            .tint(EclipseTheme.accent)
                        Text("\(course.progress.formatted(.percent.precision(.fractionLength(0)))) complete")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
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
                                    Text(lesson.title).font(.headline)
                                    Text("\(lesson.minutes) min").font(.caption).foregroundStyle(.secondary)
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
        .navigationTitle(course?.title ?? "Course")
    }
}
