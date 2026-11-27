"""Pure, DB-free per-attempt shuffling of questions and their choices.

Every QuizAttempt carries its own `question_seed`, and every order a student
sees is derived from it. Two properties matter and the implementation exists
for them:

**Stable within an attempt.** The same seed must produce the same order on
the start call, on every resume after a refresh, on submit, and on the
result/review screens — otherwise "question 3" means something different each
time the student (or the teacher reviewing them) looks at it. Nothing is
shuffled at render time; the order is a pure function of (seed, row id).

**Different between attempts.** Two attempts on one quiz get different seeds,
so a student who re-sits a quiz does not meet the same questions in the same
positions with the answer in the same slot — which, together with
`quizzes.ai_generation`'s fresh question set on every retry, is what makes a
retry a real retry rather than a recall test. Two *students* sitting the same
quiz at the same time get different orders too, so "it's the third one" is
not a usable answer to pass across a desk.

Ordering is a sort on `sha256(seed:namespace:row id)` rather than
`random.Random(seed).shuffle(...)` deliberately: the key is computed per row,
so a question added to (or deleted from) a quiz while an attempt is open
moves only itself, where a shuffle of the whole list would silently reorder
every other question underneath a student mid-attempt. sha256 (rather than
the builtin `hash`) because PYTHONHASHSEED randomizes str hashing per
process: the same attempt served by two gunicorn workers has to come out the
same way.
"""

import hashlib
import secrets

# PositiveIntegerField tops out at 2147483647 on Postgres.
MAX_SEED = 2147483647

# Attempts created before per-attempt randomization existed carry seed 0, and
# so do any rows whose seed was never assigned. It is the one value
# new_attempt_seed() never returns, and it means "serve the authored order" —
# a finished attempt keeps rendering in review exactly as its student sat it.
NO_SHUFFLE_SEED = 0


def new_attempt_seed():
    """A fresh seed for one QuizAttempt. Never 0 (see NO_SHUFFLE_SEED)."""
    return secrets.randbelow(MAX_SEED) + 1


def _ordering_key(seed, namespace, row_id):
    return hashlib.sha256(f"{seed}:{namespace}:{row_id}".encode("utf-8")).digest()


def shuffled(seed, items, *, key, namespace=""):
    """`items` in this seed's order, as a list. `key` extracts the stable row
    identifier to hash (a primary key); `namespace` separates independent
    shuffles that share one seed, so a quiz's questions and each of its
    questions' choices do not all permute together."""
    if not seed:
        return list(items)
    return sorted(items, key=lambda item: _ordering_key(seed, namespace, key(item)))
