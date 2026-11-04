"""Caption slices in, a transcript out — and the three ways that goes wrong.

Everything here is about the gap between what WebVTT *is* and what a live
transcription service actually writes into one: interim captions re-sent as
they are refined, a sentence cut in half by a slice boundary, and a speaker
carried in a tag rather than in the words. None of it is hypothetical — it is
what an hour of a real class looks like — and all of it is silent if it goes
wrong, because a wrong transcript still produces confident-looking notes.
"""

from django.test import SimpleTestCase

from .. import transcript

SIMPLE = """WEBVTT

1
00:00:01.000 --> 00:00:04.000
Today we will discuss database normalization.

2
00:00:04.500 --> 00:00:08.000
First normal form removes repeating groups.
"""


class ParseVttTests(SimpleTestCase):
    def test_a_plain_file_yields_its_cues_in_order(self):
        cues = transcript.parse_vtt(SIMPLE)
        self.assertEqual(
            [cue.text for cue in cues],
            [
                "Today we will discuss database normalization.",
                "First normal form removes repeating groups.",
            ],
        )
        self.assertEqual([cue.speaker for cue in cues], ["", ""])

    def test_a_voice_span_is_split_into_speaker_and_words(self):
        """Agora puts the channel uid in the `<v>` tag, which is the only
        thing in the file that says who was talking."""
        cues = transcript.parse_vtt(
            "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<v 4071>Can you repeat that?</v>\n"
        )
        self.assertEqual(cues[0].speaker, "4071")
        self.assertEqual(cues[0].text, "Can you repeat that?")

    def test_voice_classes_are_not_part_of_the_name(self):
        cues = transcript.parse_vtt(
            "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<v.loud 4071>Louder</v>\n"
        )
        self.assertEqual(cues[0].speaker, "4071")
        self.assertEqual(cues[0].text, "Louder")

    def test_headers_notes_and_cue_identifiers_are_not_speech(self):
        """Everything above the first timing line, and every NOTE block, is
        structure. A parser that kept any of it puts `WEBVTT` in a student's
        revision notes."""
        cues = transcript.parse_vtt(
            "﻿WEBVTT\n"
            "X-TIMESTAMP-MAP=LOCAL:00:00:00.000,MPEGTS:900000\n"
            "\n"
            "NOTE this file was produced automatically\n"
            "and this second line is part of the note\n"
            "\n"
            "cue-identifier-1\n"
            "00:00:01.000 --> 00:00:02.000\n"
            "Only this line was said.\n"
        )
        self.assertEqual([cue.text for cue in cues], ["Only this line was said."])

    def test_a_multi_line_cue_becomes_one_line(self):
        cues = transcript.parse_vtt(
            "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\n"
            "Second normal form\nremoves partial dependencies.\n"
        )
        self.assertEqual(
            [cue.text for cue in cues],
            ["Second normal form removes partial dependencies."],
        )

    def test_timings_with_settings_after_them_are_still_timings(self):
        cues = transcript.parse_vtt(
            "WEBVTT\n\n00:01.000 --> 00:04.000 align:start position:10%\nShort form timings.\n"
        )
        self.assertEqual([cue.text for cue in cues], ["Short form timings."])

    def test_inline_markup_and_entities_are_resolved(self):
        cues = transcript.parse_vtt(
            "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n"
            "<c.colorE5E5E5>x &lt; y &amp;&amp; y &gt; z</c>\n"
        )
        self.assertEqual(cues[0].text, "x < y && y > z")

    def test_a_file_that_is_not_vtt_at_all_yields_nothing(self):
        """One malformed slice must not be able to fail a class's notes."""
        self.assertEqual(transcript.parse_vtt("<html><body>404</body></html>"), [])
        self.assertEqual(transcript.parse_vtt(""), [])
        self.assertEqual(transcript.parse_vtt(None), [])

    def test_a_file_truncated_mid_cue_keeps_what_it_has(self):
        cues = transcript.parse_vtt(
            "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nThe last thing said before"
        )
        self.assertEqual([cue.text for cue in cues], ["The last thing said before"])


class SupersededCueTests(SimpleTestCase):
    """The failure that would otherwise reach a student's notes verbatim."""

    def test_interim_captions_collapse_into_the_finished_one(self):
        cues = [
            transcript.Cue("", "so the first"),
            transcript.Cue("", "so the first normal"),
            transcript.Cue("", "So the first normal form."),
            transcript.Cue("", "Next, the second."),
        ]
        self.assertEqual(
            transcript.build_transcript(cues),
            "So the first normal form. Next, the second.",
        )

    def test_an_identical_repeat_in_a_row_is_dropped_once(self):
        cues = [transcript.Cue("", "Can you hear me?")] * 3
        self.assertEqual(transcript.build_transcript(cues), "Can you hear me?")

    def test_a_genuine_repetition_with_something_between_survives(self):
        """A teacher saying "stop" twice said it twice."""
        cues = [
            transcript.Cue("", "Stop."),
            transcript.Cue("", "Everyone look at me."),
            transcript.Cue("", "Stop."),
        ]
        self.assertEqual(
            transcript.build_transcript(cues),
            "Stop. Everyone look at me. Stop.",
        )

    def test_one_speaker_never_supersedes_another(self):
        """Two people saying overlapping words are two people, and losing one
        of them loses the question a student asked."""
        cues = [
            transcript.Cue("1", "the answer is"),
            transcript.Cue("2", "the answer is four"),
        ]
        self.assertEqual(
            transcript.build_transcript(cues),
            "1: the answer is\n2: the answer is four",
        )


class BuildTranscriptTests(SimpleTestCase):
    def test_a_known_uid_becomes_a_name_and_an_unknown_one_keeps_its_number(self):
        """A wrong name against a quote is worse than no name."""
        cues = [
            transcript.Cue("7", "Open your books."),
            transcript.Cue("9", "Which page?"),
        ]
        text = transcript.build_transcript(cues, speaker_names={"7": "Mr Smith"})
        self.assertEqual(text, "Mr Smith: Open your books.\n9: Which page?")

    def test_consecutive_turns_from_one_speaker_become_one_paragraph(self):
        cues = [
            transcript.Cue("7", "Open your books."),
            transcript.Cue("7", "We are on chapter four."),
        ]
        self.assertEqual(
            transcript.build_transcript(cues, speaker_names={"7": "Mr Smith"}),
            "Mr Smith: Open your books. We are on chapter four.",
        )

    def test_empty_cues_contribute_nothing(self):
        self.assertEqual(transcript.build_transcript([]), "")


class PlaylistOrderTests(SimpleTestCase):
    def test_the_playlist_decides_the_order(self):
        keys = ["p/b.vtt", "p/a.vtt"]
        playlist = "#EXTM3U\n#EXTINF:60,\na.vtt\n#EXTINF:60,\nb.vtt\n#EXT-X-ENDLIST\n"
        self.assertEqual(
            transcript.playlist_order(playlist, keys), ["p/a.vtt", "p/b.vtt"]
        )

    def test_slices_the_playlist_does_not_mention_are_appended_not_dropped(self):
        """A slice flushed after the playlist was last written is still part
        of the lesson."""
        keys = ["p/a.vtt", "p/b.vtt", "p/c.vtt"]
        playlist = "#EXTM3U\na.vtt\nb.vtt\n"
        self.assertEqual(
            transcript.playlist_order(playlist, keys),
            ["p/a.vtt", "p/b.vtt", "p/c.vtt"],
        )

    def test_no_playlist_means_the_keys_order_stands(self):
        keys = ["p/a.vtt", "p/b.vtt"]
        self.assertEqual(transcript.playlist_order("", keys), keys)


class TranscriptFromSlicesTests(SimpleTestCase):
    def test_a_sentence_split_across_two_slices_is_joined_back_up(self):
        """Agora cuts on the clock, not on sentences — the refinement that
        completes a half-sentence is in the *next* file."""
        first = "WEBVTT\n\n00:00:58.000 --> 00:01:00.000\nNormalization improves\n"
        second = (
            "WEBVTT\n\n00:01:00.000 --> 00:01:02.000\n"
            "Normalization improves database consistency.\n"
        )
        text = transcript.transcript_from_slices(
            [("p/0.vtt", first), ("p/1.vtt", second)]
        )
        self.assertEqual(text, "Normalization improves database consistency.")

    def test_one_unreadable_slice_does_not_lose_the_others(self):
        text = transcript.transcript_from_slices(
            [
                ("p/0.vtt", "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nKept.\n"),
                ("p/1.vtt", None),
                ("p/2.vtt", "WEBVTT\n\n00:00:03.000 --> 00:00:04.000\nAlso kept.\n"),
            ]
        )
        self.assertEqual(text, "Kept. Also kept.")
