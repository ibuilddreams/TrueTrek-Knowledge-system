def notify_new_message(message):
    """No-op placeholder. Swap this for a websocket/Pusher publish call when
    real-time delivery is introduced — this is the single call site in
    messaging/ that a future real-time transport needs to touch; every message
    send already flows through services.send_message, which calls this."""
    pass


def notify_message_edited(message):
    """No-op placeholder — see notify_new_message."""
    pass


def notify_message_deleted(message):
    """No-op placeholder — see notify_new_message."""
    pass


def notify_reaction_changed(message):
    """No-op placeholder — see notify_new_message."""
    pass
