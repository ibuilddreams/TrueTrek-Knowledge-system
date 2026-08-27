from rest_framework.throttling import ScopedRateThrottle


class MessageSendThrottle(ScopedRateThrottle):
    scope = "message-send"
