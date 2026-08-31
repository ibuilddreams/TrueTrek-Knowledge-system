from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from common.response import error_response, success_response

from .serializers import AdvisorChatRequestSerializer
from .services import AdvisorReplyError, get_advisor_reply
from .throttling import AdvisorChatThrottle


class AdvisorChatView(APIView):
    """Single Gemini-backed chat endpoint shared by every advisor-persona feature
    on the frontend: the homepage's public floating Concierge chat and inline
    consultation board (frontend/src/components/features/home/Home.jsx), the
    student portal's War Room (WarRoomTab.jsx), the teacher dashboard's AI class
    report (DashboardTab.jsx), and the (currently disabled) store advisor
    (StoreAdvisorSuite.jsx). All of them already build their own persona/system
    prompt client-side from frontend/src/data/curriculum.js and send it verbatim
    as `systemPrompt` — this view keeps that exact contract (scenario,
    systemPrompt, advisorName) so none of those call sites needed to change; it
    only replaces frontend/src/app/api/advisor's old Next.js route (which called
    Gemini directly from the Next.js server using its own GEMINI_API_KEY) with a
    Django view that reuses ai_courses' provider and this backend's key.

    AllowAny because the homepage widget is used by anonymous visitors; the
    scoped throttle below is the abuse guard in place of authentication."""

    permission_classes = [AllowAny]
    throttle_classes = [AdvisorChatThrottle]
    throttle_scope = "advisor-chat"

    def post(self, request, *args, **kwargs):
        serializer = AdvisorChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reply = get_advisor_reply(**serializer.validated_data)
        except AdvisorReplyError as exc:
            return error_response(message=str(exc), status_code=502)

        return success_response(reply, message="Advisor reply generated successfully")
