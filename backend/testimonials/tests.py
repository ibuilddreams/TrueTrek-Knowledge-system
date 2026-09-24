from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Testimonial, TestimonialStatus

UserModel = get_user_model()


class TestimonialSubmitTests(APITestCase):
    def test_public_can_submit_testimonial(self):
        response = self.client.post(
            "/api/testimonials/submit/",
            {
                "name": "Jordan Miller",
                "role": "PAC-12 Basketball Recruit",
                "school": "University of Oregon",
                "sport": "Basketball (D1)",
                "quote": "The War Room advisor console is incredible.",
                "rating": 5,
            },
        )
        self.assertEqual(response.status_code, 201)
        testimonial = Testimonial.objects.get()
        self.assertEqual(testimonial.status, TestimonialStatus.PENDING)

    def test_invalid_rating_rejected(self):
        response = self.client.post(
            "/api/testimonials/submit/",
            {"name": "Jordan Miller", "quote": "Great program.", "rating": 9},
        )
        self.assertEqual(response.status_code, 400)


class PublicTestimonialListTests(APITestCase):
    def test_only_published_testimonials_are_public(self):
        Testimonial.objects.create(name="Pending Person", quote="...", rating=5, status=TestimonialStatus.PENDING)
        published = Testimonial.objects.create(
            name="Published Person", quote="Great!", rating=5, status=TestimonialStatus.PUBLISHED
        )
        Testimonial.objects.create(name="Hidden Person", quote="...", rating=5, status=TestimonialStatus.HIDDEN)

        response = self.client.get("/api/testimonials/public/")
        self.assertEqual(response.status_code, 200)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], published.id)


class AdminTestimonialModerationTests(APITestCase):
    def setUp(self):
        self.admin = UserModel.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="pass12345",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.OTHER,
        )
        self.testimonial = Testimonial.objects.create(name="Test Person", quote="Nice.", rating=4)

    def test_non_admin_cannot_list(self):
        response = self.client.get("/api/testimonials/admin/")
        self.assertEqual(response.status_code, 401)

    def test_admin_can_publish_hide_and_delete(self):
        self.client.force_authenticate(self.admin)

        publish_url = f"/api/testimonials/admin/{self.testimonial.id}/publish/"
        response = self.client.post(publish_url)
        self.assertEqual(response.status_code, 200)
        self.testimonial.refresh_from_db()
        self.assertEqual(self.testimonial.status, TestimonialStatus.PUBLISHED)

        hide_url = f"/api/testimonials/admin/{self.testimonial.id}/hide/"
        response = self.client.post(hide_url)
        self.assertEqual(response.status_code, 200)
        self.testimonial.refresh_from_db()
        self.assertEqual(self.testimonial.status, TestimonialStatus.HIDDEN)

        delete_url = f"/api/testimonials/admin/{self.testimonial.id}/"
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Testimonial.objects.filter(id=self.testimonial.id).exists())
