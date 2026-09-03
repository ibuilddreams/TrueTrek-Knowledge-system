from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import TeacherRequest, TeacherRequestStatus, TeacherRequestType

UserModel = get_user_model()


class TeacherRequestTests(APITestCase):
    def setUp(self):
        self.list_create_url = reverse("teacher-request-list-create")
        self.admin_list_url = reverse("teacher-request-admin-list")

        self.teacher = UserModel.objects.create_user(
            username="reqteacher",
            email="reqteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )
        self.other_teacher = UserModel.objects.create_user(
            username="otherteacher",
            email="otherteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )
        self.student = UserModel.objects.create_user(
            username="reqstudent",
            email="reqstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.admin = UserModel.objects.create_user(
            username="reqadmin",
            email="reqadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )

        self.valid_payload = {
            "request_type": TeacherRequestType.ERROR_REPORT,
            "title": "Incorrect information in Lesson 4",
            "description": "The video currently attached to Lesson 4 is incorrect.",
        }

    def _detail_url(self, pk):
        return reverse("teacher-request-detail", kwargs={"pk": pk})

    def _admin_detail_url(self, pk):
        return reverse("teacher-request-admin-detail", kwargs={"pk": pk})

    # --- Creation ---

    def test_teacher_can_create_request(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(self.list_create_url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_obj = TeacherRequest.objects.get()
        self.assertEqual(request_obj.teacher, self.teacher)
        self.assertEqual(request_obj.status, TeacherRequestStatus.PENDING)
        self.assertEqual(request_obj.title, self.valid_payload["title"])

    def test_create_ignores_client_supplied_teacher_and_status(self):
        self.client.force_authenticate(user=self.teacher)
        payload = {
            **self.valid_payload,
            "teacher": self.other_teacher.id,
            "status": TeacherRequestStatus.COMPLETED,
        }

        response = self.client.post(self.list_create_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_obj = TeacherRequest.objects.get()
        self.assertEqual(request_obj.teacher, self.teacher)
        self.assertEqual(request_obj.status, TeacherRequestStatus.PENDING)

    def test_create_requires_title_and_description(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(
            self.list_create_url,
            {"request_type": TeacherRequestType.CHANGE_REQUEST, "title": "", "description": ""},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(TeacherRequest.objects.count(), 0)

    def test_create_rejects_invalid_request_type(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(
            self.list_create_url,
            {**self.valid_payload, "request_type": "NOT_A_TYPE"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_create_request(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.list_create_url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_request(self):
        response = self.client.post(self.list_create_url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Teacher listing / visibility ---

    def test_teacher_can_list_own_requests(self):
        self.client.force_authenticate(user=self.teacher)
        self.client.post(self.list_create_url, self.valid_payload)
        self.client.force_authenticate(user=self.other_teacher)
        self.client.post(self.list_create_url, self.valid_payload)

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.list_create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["teacher"]["id"], self.teacher.id)

    def test_teacher_cannot_view_another_teachers_request_detail(self):
        self.client.force_authenticate(user=self.other_teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        other_request_id = create_response.data["data"]["id"]

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self._detail_url(other_request_id))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_teacher_can_view_own_request_detail(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        response = self.client.get(self._detail_url(request_id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["id"], request_id)

    # --- Admin access ---

    def test_non_admin_cannot_list_admin_requests(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.admin_list_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_all_requests(self):
        self.client.force_authenticate(user=self.teacher)
        self.client.post(self.list_create_url, self.valid_payload)
        self.client.force_authenticate(user=self.other_teacher)
        self.client.post(self.list_create_url, self.valid_payload)

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.admin_list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 2)

    def test_admin_can_filter_by_status_and_search(self):
        self.client.force_authenticate(user=self.teacher)
        self.client.post(self.list_create_url, self.valid_payload)

        self.client.force_authenticate(user=self.admin)
        request_id = TeacherRequest.objects.get().id
        self.client.patch(
            self._admin_detail_url(request_id), {"status": TeacherRequestStatus.IN_PROGRESS}
        )

        response = self.client.get(self.admin_list_url, {"status": "IN_PROGRESS"})
        self.assertEqual(response.data["data"]["count"], 1)

        response = self.client.get(self.admin_list_url, {"status": "COMPLETED"})
        self.assertEqual(response.data["data"]["count"], 0)

        response = self.client.get(self.admin_list_url, {"search": "Lesson 4"})
        self.assertEqual(response.data["data"]["count"], 1)

    def test_admin_can_view_any_request_detail(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self._admin_detail_url(request_id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["id"], request_id)

    # --- Status transitions / completion ---

    def test_admin_can_update_status_to_in_progress(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self._admin_detail_url(request_id), {"status": TeacherRequestStatus.IN_PROGRESS}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        request_obj = TeacherRequest.objects.get(id=request_id)
        self.assertEqual(request_obj.status, TeacherRequestStatus.IN_PROGRESS)
        self.assertEqual(request_obj.handled_by, self.admin)
        self.assertIsNone(request_obj.completed_at)

    def test_admin_cannot_complete_without_resolution_description(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self._admin_detail_url(request_id), {"status": TeacherRequestStatus.COMPLETED}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        request_obj = TeacherRequest.objects.get(id=request_id)
        self.assertEqual(request_obj.status, TeacherRequestStatus.PENDING)

    def test_admin_can_complete_with_resolution_description(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        resolution = "The incorrect Lesson 4 video has been replaced with the updated version."
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self._admin_detail_url(request_id),
            {"status": TeacherRequestStatus.COMPLETED, "resolution_description": resolution},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        request_obj = TeacherRequest.objects.get(id=request_id)
        self.assertEqual(request_obj.status, TeacherRequestStatus.COMPLETED)
        self.assertEqual(request_obj.resolution_description, resolution)
        self.assertEqual(request_obj.handled_by, self.admin)
        self.assertIsNotNone(request_obj.completed_at)

    def test_completed_request_cannot_be_modified_again(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        self.client.force_authenticate(user=self.admin)
        self.client.patch(
            self._admin_detail_url(request_id),
            {"status": TeacherRequestStatus.COMPLETED, "resolution_description": "Fixed."},
        )

        response = self.client.patch(
            self._admin_detail_url(request_id), {"status": TeacherRequestStatus.IN_PROGRESS}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_update_request_status(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        response = self.client.patch(
            self._admin_detail_url(request_id), {"status": TeacherRequestStatus.IN_PROGRESS}
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        request_obj = TeacherRequest.objects.get(id=request_id)
        self.assertEqual(request_obj.status, TeacherRequestStatus.PENDING)

    def test_teacher_sees_completion_details_after_admin_resolves(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        resolution = "The incorrect Lesson 4 video has been replaced with the updated version."
        self.client.force_authenticate(user=self.admin)
        self.client.patch(
            self._admin_detail_url(request_id),
            {"status": TeacherRequestStatus.COMPLETED, "resolution_description": resolution},
        )

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self._detail_url(request_id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["status"], TeacherRequestStatus.COMPLETED)
        self.assertEqual(data["resolution_description"], resolution)
        self.assertIsNotNone(data["completed_at"])

    def test_invalid_status_value_rejected(self):
        self.client.force_authenticate(user=self.teacher)
        create_response = self.client.post(self.list_create_url, self.valid_payload)
        request_id = create_response.data["data"]["id"]

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self._admin_detail_url(request_id), {"status": "BOGUS"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
