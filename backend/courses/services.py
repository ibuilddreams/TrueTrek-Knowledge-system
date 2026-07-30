from .models import CourseInstructor


def is_course_instructor(user, course):
    return CourseInstructor.objects.filter(course=course, instructor=user).exists()
