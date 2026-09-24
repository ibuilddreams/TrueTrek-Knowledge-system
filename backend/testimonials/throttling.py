from rest_framework.throttling import ScopedRateThrottle


class TestimonialSubmitThrottle(ScopedRateThrottle):
    """Guards the public, unauthenticated testimonial submission endpoint from spam."""

    scope = "testimonial-submit"
