from rest_framework.throttling import ScopedRateThrottle


class RoomMessageSendThrottle(ScopedRateThrottle):
    scope = "room-message-send"
