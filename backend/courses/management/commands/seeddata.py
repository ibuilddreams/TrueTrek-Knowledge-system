from datetime import timedelta

import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from assignments.models import Assignment
from carts.models import CartItem
from common.models import Status
from common.ordering import get_next_order
from courses.models import Category, Course, CourseInstructor, Tag
from daily_drill.models import DrillOption, DrillQuestion
from enrollments.models import Enrollment, EnrollmentHistory
from future_clients.models import FutureClientApplication
from lessons.models import Lesson
from modules.models import Module
from onboarding.models import OnboardingProgress
from onboarding.models import Question as OnboardingQuestion
from onboarding.models import QuestionOption, QuestionOptionPathwayWeight
from pathways.models import Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment
from progress.models import CourseProgress, LearningActivity, LessonProgress, ModuleProgress
from quizzes.models import Choice
from quizzes.models import Question as QuizQuestion
from quizzes.models import Quiz
from tiers.models import Tier, TierPathway, TierProgress

User = get_user_model()

# Explicitly requested password for every seeded teacher/student account. The
# admin account is never touched by this command (see `_reset_data`/`_create_admin`)
# so it keeps whatever password it already has.
DEFAULT_PASSWORD = "1234567a-"

ADMIN_DATA = {"email": "admin@example.com", "first_name": "Admin", "last_name": "User"}

TEACHER_NAMES = [
    ("Michael", "Carter"),
    ("Sarah", "Bennett"),
    ("David", "Nguyen"),
    ("Emily", "Rodriguez"),
    ("James", "Whitfield"),
    ("Olivia", "Martinez"),
    ("Daniel", "Thompson"),
    ("Robert", "Ellison"),
    ("Natalie", "Brooks"),
]

STUDENT_NAMES = [
    ("Ava", "Johnson"),
    ("Liam", "Smith"),
    ("Sophia", "Brown"),
    ("Noah", "Davis"),
    ("Isabella", "Miller"),
    ("Mason", "Wilson"),
    ("Mia", "Moore"),
    ("Ethan", "Taylor"),
    ("Charlotte", "Anderson"),
    ("Lucas", "Thomas"),
    ("Amelia", "Jackson"),
    ("Benjamin", "White"),
    ("Harper", "Harris"),
    ("Elijah", "Martin"),
    ("Evelyn", "Thompson"),
    ("Alexander", "Garcia"),
    ("Abigail", "Martinez"),
    ("William", "Robinson"),
    ("Emily", "Clark"),
    ("Jacob", "Lewis"),
]

# The single curated category vocabulary shared by Course.category and
# Tier.category (see courses/migrations/0003_seed_tier_categories.py and
# 0004_consolidate_categories.py). `_reset_data` wipes every category and this
# command recreates exactly this list, so a reseed can never reintroduce the
# divergent one-off categories those migrations consolidated away.
CATEGORY_NAMES = ["Academic", "Athletic", "Foundation", "Legacy", "Professional", "Vocational"]

YOUTUBE_DEMO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Real, publicly hosted sample files. `_download_assets` fetches each one ONCE
# into MEDIA_ROOT before the seeding transaction opens, then the seeded rows
# point their FileField/ImageField at the saved copy. Downloading (rather than
# committing fixtures) is what makes local and server seeds identical, since
# backend/media/ is gitignored and shipped fixtures would never reach the server.
LESSON_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
LESSON_DOCX_URL = "https://calibre-ebook.com/downloads/demos/demo.docx"

# Every PDF/DOCX lesson shares one downloaded file rather than getting its own
# copy — the seeded documents are identical demo content, so 50+ duplicates on
# disk would buy nothing.
LESSON_ASSET_PATHS = {
    "pdf": "lessons/seed-sample-lesson.pdf",
    "docx": "lessons/seed-sample-lesson.docx",
}
LESSON_ASSET_URLS = {"pdf": LESSON_PDF_URL, "docx": LESSON_DOCX_URL}

# One thumbnail per course, keyed by course code. Course.thumbnail is an
# ImageField, so these are downloaded into MEDIA_ROOT/course_thumbnails/ and the
# field points at the local copy — a remote URL cannot be stored directly,
# because the serializers render it through `thumbnail.url` (see
# courses/serializers.py and common/image.py).
COURSE_THUMBNAIL_URLS = {
    "PYTHON101": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80",
    "WEBDEV101": "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200&q=80",
    "ALGEBRA101": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80",
    "HISTORY101": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&q=80",
    "BIOLOGY101": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=80",
    "BUSINESS101": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
    "WRITING101": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80",
    "ATHLETIC101": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80",
    "NIL101": "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
    "T1-01": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80",
    "T1-02": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
    "T1-03": "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80",
}

# Every module gets exactly these three lesson types, in this order, per the
# "PDF, Video, DOC/DOCX in every module" requirement.
LESSON_TYPE_CYCLE = [Lesson.ContentType.VIDEO, Lesson.ContentType.PDF, Lesson.ContentType.DOCUMENT]

LESSON_TYPE_LABELS = {
    Lesson.ContentType.VIDEO: "Video Walkthrough",
    Lesson.ContentType.PDF: "Reading (PDF)",
    Lesson.ContentType.DOCUMENT: "Reference Guide (DOCX)",
}

# `asset` names the LESSON_ASSET_PATHS entry attached to Lesson.file. PDF and
# DOCUMENT lessons must carry a file — lessons/serializers.py rejects them
# without one — while VIDEO lessons carry a video_url instead.
LESSON_TYPE_CONTENT = {
    Lesson.ContentType.VIDEO: {
        "video_url": YOUTUBE_DEMO_URL,
        "content_data": "",
        "duration_minutes": 12,
        "asset": None,
    },
    Lesson.ContentType.PDF: {
        "video_url": None,
        "content_data": "Downloadable PDF reference material covering this module's topic in depth.",
        "duration_minutes": None,
        "asset": "pdf",
    },
    Lesson.ContentType.DOCUMENT: {
        "video_url": None,
        "content_data": "Supplementary DOCX handout with worked examples and practice notes.",
        "duration_minutes": None,
        "asset": "docx",
    },
}
COURSE_DEFS = [
    {
        "code": "PYTHON101",
        "title": "Python Programming Fundamentals",
        "category": "Vocational",
        "description": "A hands-on introduction to Python covering core syntax, data structures, functions, and object-oriented programming.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 149,
        "modules": [
            {
                "title": "Python Basics & Syntax",
                "description": "Core Python syntax, variables, data types, and basic input/output.",
                "assignment": {
                    "title": "Write Your First Python Scripts",
                    "description": "Complete a set of short Python scripts demonstrating variables, data types, and basic input/output operations covered in this module.",
                },
                "questions": [
                    ("Which keyword is used to define a function in Python?", ["def", "function", "func", "define"], 0),
                    ("What data type is the result of 7 / 2 in Python 3?", ["float", "int", "str", "bool"], 0),
                    ("Which symbol is used to start a comment in Python?", ["#", "//", "/* */", "--"], 0),
                    ("What is the correct file extension for Python files?", [".py", ".pt", ".python", ".pyt"], 0),
                    ("Which of these is a mutable data type in Python?", ["list", "tuple", "str", "int"], 0),
                    ("What does the len() function return?", ["The length of an object", "The type of an object", "A memory address", "A boolean value"], 0),
                    ("Which operator is used for exponentiation in Python?", ["**", "^", "%%", "exp()"], 0),
                    ("What will print(type(5)) output?", ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"], 0),
                    ("Which of the following is NOT a valid Python variable name?", ["2value", "value2", "_value", "value_2"], 0),
                    ("What is the output of bool(0)?", ["False", "True", "0", "Error"], 0),
                ],
            },
            {
                "title": "Data Structures & Functions",
                "description": "Lists, dictionaries, tuples, sets, and writing reusable functions.",
                "assignment": {
                    "title": "Build a Data Processing Function Library",
                    "description": "Create Python functions that manipulate lists, dictionaries, and tuples to solve the practice problems provided in class.",
                },
                "questions": [
                    ("Which data structure uses key-value pairs?", ["Dictionary", "List", "Tuple", "Set"], 0),
                    ("Which method adds an item to the end of a list?", ["append()", "add()", "push()", "insert(0)"], 0),
                    ("Which of these creates an empty set in Python?", ["set()", "{}", "[]", "()"], 0),
                    ("Which keyword is used to return a value from a function?", ["return", "yield", "give", "output"], 0),
                    ("Which built-in function converts a string to an integer?", ["int()", "str()", "float()", "num()"], 0),
                    ("What is the output of len([1, 2, 3])?", ["3", "2", "1", "Error"], 0),
                    ("Which loop is best used when the number of iterations is known?", ["for", "while", "do-while", "repeat"], 0),
                    ("What does *args allow a function to accept?", ["A variable number of positional arguments", "Keyword arguments only", "Exactly one argument", "No arguments"], 0),
                    ("Which method removes and returns the last item of a list?", ["pop()", "remove()", "delete()", "discard()"], 0),
                    ("What best describes a tuple in Python?", ["An immutable ordered collection", "A mutable ordered collection", "A key-value mapping", "An unordered collection of unique items"], 0),
                ],
            },
            {
                "title": "Object-Oriented Programming",
                "description": "Classes, objects, inheritance, and encapsulation in Python.",
                "assignment": {
                    "title": "Design a Simple Class Hierarchy",
                    "description": "Model a real-world system (for example, a library or a store) using Python classes, inheritance, and encapsulation.",
                },
                "questions": [
                    ("Which keyword is used to define a class in Python?", ["class", "def", "object", "struct"], 0),
                    ("What is the special method called when an object is created?", ["__init__", "__new__", "__create__", "__start__"], 0),
                    ("What does 'self' refer to inside a class method?", ["The instance of the class", "The class itself", "A global variable", "The parent class"], 0),
                    ("Which concept allows a child class to use methods of a parent class?", ["Inheritance", "Encapsulation", "Polymorphism", "Abstraction"], 0),
                    ("What is encapsulation?", ["Bundling data and methods within a class", "Creating multiple classes", "Deleting objects", "Converting data types"], 0),
                    ("Which term describes a class that derives from another class?", ["Subclass", "Superclass", "Interface", "Module"], 0),
                    ("What does polymorphism allow in OOP?", ["Objects of different classes to be treated through a common interface", "Only one class to exist", "Classes to have no methods", "Variables to change type freely"], 0),
                    ("Which naming convention indicates a 'private' attribute in Python?", ["A leading double underscore (__)", "A leading dollar sign ($)", "All caps", "A trailing underscore"], 0),
                    ("What is a constructor used for?", ["Initializing a new object's attributes", "Destroying an object", "Importing a module", "Comparing two objects"], 0),
                    ("How does a class inherit from another class in Python?", ["class Child(Parent):", "class Child extends Parent:", "class Child implements Parent:", "class Child inherits Parent:"], 0),
                ],
            },
        ],
    },
    {
        "code": "WEBDEV101",
        "title": "Web Development with JavaScript",
        "category": "Vocational",
        "description": "Build modern, interactive websites with HTML, CSS, and JavaScript, from static pages to dynamic web apps.",
        "difficulty": Course.Difficulty.INTERMEDIATE,
        "amount": 179,
        "modules": [
            {
                "title": "HTML & CSS Foundations",
                "description": "Structuring web pages with HTML and styling them with CSS.",
                "assignment": {
                    "title": "Build a Static Personal Portfolio Page",
                    "description": "Create a single-page HTML/CSS portfolio site applying the layout and styling techniques covered in this module.",
                },
                "questions": [
                    ("What does HTML stand for?", ["HyperText Markup Language", "HighText Machine Language", "HyperText Machine Language", "HyperTransfer Markup Language"], 0),
                    ("Which HTML tag is used to create a hyperlink?", ["<a>", "<link>", "<href>", "<url>"], 0),
                    ("Which CSS property changes text color?", ["color", "font-color", "text-color", "foreground"], 0),
                    ("What does CSS stand for?", ["Cascading Style Sheets", "Creative Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"], 0),
                    ("Which tag defines the largest heading in HTML?", ["<h1>", "<h6>", "<head>", "<heading>"], 0),
                    ("Which CSS property controls spacing outside an element's border?", ["margin", "padding", "border", "spacing"], 0),
                    ("Which attribute specifies alternate text for an image?", ["alt", "src", "title", "alt-text"], 0),
                    ("Which CSS display value hides an element completely from layout?", ["none", "hidden", "invisible", "collapse"], 0),
                    ("What does the <div> tag represent?", ["A generic container for content", "A table row", "A hyperlink", "An image"], 0),
                    ("Which CSS unit is relative to the root element's font size?", ["rem", "px", "em", "vh"], 0),
                ],
            },
            {
                "title": "JavaScript Basics",
                "description": "Core JavaScript syntax, variables, functions, and array methods.",
                "assignment": {
                    "title": "Interactive To-Do List Script",
                    "description": "Write vanilla JavaScript that adds, removes, and marks items complete on a simple to-do list.",
                },
                "questions": [
                    ("Which keyword declares a block-scoped variable in JavaScript?", ["let", "var", "int", "dim"], 0),
                    ("What does '===' check in JavaScript?", ["Strict equality (value and type)", "Loose equality (value only)", "Assignment", "Inequality"], 0),
                    ("Which method converts a JSON string into a JavaScript object?", ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "Object.parse()"], 0),
                    ("What data type is returned by typeof null?", ["\"object\"", "\"null\"", "\"undefined\"", "\"boolean\""], 0),
                    ("Which array method adds an element to the end of an array?", ["push()", "pop()", "shift()", "unshift()"], 0),
                    ("How do you write a single-line comment in JavaScript?", ["//", "#", "<!-- -->", "**"], 0),
                    ("Which function prints output to the browser console?", ["console.log()", "print()", "echo()", "console.write()"], 0),
                    ("What does 'NaN' stand for?", ["Not a Number", "Null and None", "No Assigned Number", "New Array Node"], 0),
                    ("Which keyword defines a constant that cannot be reassigned?", ["const", "let", "var", "static"], 0),
                    ("What does \"5\" + 5 evaluate to in JavaScript?", ["\"55\"", "10", "An error", "NaN"], 0),
                ],
            },
            {
                "title": "Building Interactive Web Apps",
                "description": "DOM manipulation, events, and working with APIs using JavaScript.",
                "assignment": {
                    "title": "Fetch & Display API Data",
                    "description": "Use the Fetch API and DOM manipulation to retrieve data from a public API and render it dynamically on a webpage.",
                },
                "questions": [
                    ("What is the DOM?", ["A programming interface representing the page structure", "A database", "A CSS framework", "A server"], 0),
                    ("Which method selects an HTML element by its id?", ["document.getElementById()", "document.querySelectorId()", "document.getElement()", "document.selectById()"], 0),
                    ("Which event fires when a user clicks a button?", ["click", "hover", "submit", "change"], 0),
                    ("What does addEventListener do?", ["Attaches an event handler to an element", "Removes an element", "Styles an element", "Creates a new element"], 0),
                    ("Which HTTP method is typically used to retrieve data from a server?", ["GET", "POST", "PUT", "DELETE"], 0),
                    ("What is AJAX primarily used for?", ["Making asynchronous requests without reloading the page", "Styling pages", "Defining page structure", "Compiling code"], 0),
                    ("Which built-in JavaScript object is used to work with dates?", ["Date", "Time", "Calendar", "Clock"], 0),
                    ("What does fetch() return in JavaScript?", ["A Promise", "A string", "A number", "An array"], 0),
                    ("Which array method transforms every element and returns a new array?", ["map()", "forEach()", "filter()", "reduce()"], 0),
                    ("What is a callback function?", ["A function passed into another function to be executed later", "A function that calls itself", "A deprecated function", "A function with no arguments"], 0),
                ],
            },
        ],
    },
    {
        "code": "ALGEBRA101",
        "title": "Algebra & Geometry Essentials",
        "category": "Academic",
        "description": "Build a strong foundation in algebra and geometry, from linear equations to core geometric formulas.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 99,
        "modules": [
            {
                "title": "Linear Equations & Inequalities",
                "description": "Solving and graphing linear equations and inequalities.",
                "assignment": {
                    "title": "Solving Linear Equations Practice Set",
                    "description": "Solve a set of linear equations and inequalities, showing all steps of your work.",
                },
                "questions": [
                    ("What is the solution to 2x + 4 = 10?", ["x = 3", "x = 2", "x = 5", "x = 7"], 0),
                    ("What is the slope-intercept form of a line?", ["y = mx + b", "y = b + x", "ax + by = c", "y = mx^2 + b"], 0),
                    ("What does the slope of a line represent?", ["The rate of change (steepness)", "The y-intercept", "The x-intercept", "The length of the line"], 0),
                    ("Solve for x: 3x - 5 = 16", ["x = 7", "x = 6", "x = 21", "x = 11"], 0),
                    ("What is the y-intercept of the line y = 5x - 3?", ["-3", "5", "3", "-5"], 0),
                    ("Which of the following is a linear inequality?", ["x + 3 > 7", "x^2 = 9", "x^3 - 1 = 0", "sin(x) = 1"], 0),
                    ("If 4x = 20, what is x?", ["5", "4", "16", "24"], 0),
                    ("What is the solution set of x - 2 < 5?", ["x < 7", "x > 7", "x < 3", "x > 3"], 0),
                    ("Two lines with the same slope but different y-intercepts are:", ["Parallel", "Perpendicular", "Intersecting", "Identical"], 0),
                    ("What is the product of the slopes of two perpendicular lines?", ["-1", "0", "1", "Undefined"], 0),
                ],
            },
            {
                "title": "Polynomials & Factoring",
                "description": "Operations on polynomials and common factoring techniques.",
                "assignment": {
                    "title": "Factoring Polynomials Worksheet",
                    "description": "Factor the given polynomial expressions completely and verify your answers by expansion.",
                },
                "questions": [
                    ("What is the degree of the polynomial 4x^3 + 2x - 7?", ["3", "2", "4", "7"], 0),
                    ("Factor: x^2 - 9", ["(x - 3)(x + 3)", "(x - 9)(x + 1)", "(x - 3)^2", "(x + 9)(x - 1)"], 0),
                    ("What is (x + 2)(x + 3) expanded?", ["x^2 + 5x + 6", "x^2 + 6x + 5", "x^2 + 5x + 5", "x^2 + 6x + 6"], 0),
                    ("What is the greatest common factor of 12 and 18?", ["6", "3", "9", "12"], 0),
                    ("Which of these is a perfect square trinomial?", ["x^2 + 6x + 9", "x^2 + 5x + 6", "x^2 + 7x + 10", "x^2 + 4x + 3"], 0),
                    ("What is the sum of the roots of x^2 - 5x + 6 = 0?", ["5", "6", "-5", "-6"], 0),
                    ("Simplify: 3x^2 + 2x^2", ["5x^2", "6x^4", "5x^4", "6x^2"], 0),
                    ("What is the value of x in x^2 = 16?", ["±4", "4 only", "8", "-8"], 0),
                    ("Factor completely: 2x^2 + 4x", ["2x(x + 2)", "2(x^2 + 2x)", "x(2x + 4)", "4x(x + 1)"], 0),
                    ("What is the product of (x - 4)(x + 4)?", ["x^2 - 16", "x^2 + 16", "x^2 - 8x + 16", "x^2 - 8"], 0),
                ],
            },
            {
                "title": "Geometry Fundamentals",
                "description": "Core geometry concepts including area, perimeter, and volume.",
                "assignment": {
                    "title": "Geometry Problem Set: Area & Volume",
                    "description": "Calculate the area, perimeter, and volume of the given geometric shapes and solids.",
                },
                "questions": [
                    ("How many degrees are in a triangle's interior angles combined?", ["180", "360", "90", "270"], 0),
                    ("What is the formula for the area of a circle?", ["πr^2", "2πr", "πd", "r^2"], 0),
                    ("What is the Pythagorean theorem?", ["a^2 + b^2 = c^2", "a + b = c", "a^2 - b^2 = c^2", "a * b = c^2"], 0),
                    ("How many sides does a hexagon have?", ["6", "5", "7", "8"], 0),
                    ("What is the sum of the interior angles of a quadrilateral?", ["360", "180", "270", "540"], 0),
                    ("What do you call a triangle with all three sides equal?", ["Equilateral", "Isosceles", "Scalene", "Right"], 0),
                    ("Which formula calculates the circumference of a circle?", ["2πr", "πr^2", "4r^2", "r/2"], 0),
                    ("What is the volume of a cube with side length 3?", ["27", "9", "18", "6"], 0),
                    ("Two angles that sum to 90 degrees are called:", ["Complementary", "Supplementary", "Adjacent", "Vertical"], 0),
                    ("What is the measure of each interior angle of an equilateral triangle?", ["60 degrees", "90 degrees", "45 degrees", "120 degrees"], 0),
                ],
            },
        ],
    },
    {
        "code": "HISTORY101",
        "title": "World History: Civilizations & Empires",
        "category": "Academic",
        "description": "Trace the rise and fall of major civilizations and empires, from ancient Egypt to the early modern world.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 89,
        "modules": [
            {
                "title": "Ancient Civilizations",
                "description": "Egypt, Mesopotamia, the Indus Valley, and early China.",
                "assignment": {
                    "title": "Ancient Civilizations Comparison Essay",
                    "description": "Write a short essay comparing the achievements of two ancient civilizations covered in this module.",
                },
                "questions": [
                    ("Which river was central to Ancient Egyptian civilization?", ["The Nile", "The Tigris", "The Euphrates", "The Ganges"], 0),
                    ("Which writing system did the Sumerians develop?", ["Cuneiform", "Hieroglyphics", "The alphabet", "Braille"], 0),
                    ("Which ancient civilization built the Great Pyramid of Giza?", ["The Egyptians", "The Romans", "The Greeks", "The Babylonians"], 0),
                    ("The Code of Hammurabi originated in which civilization?", ["Babylon", "Egypt", "Greece", "Rome"], 0),
                    ("Which ancient civilization is credited with developing democracy?", ["Ancient Greece", "Ancient Rome", "Ancient Egypt", "Ancient China"], 0),
                    ("What was the primary writing material used in Ancient Egypt?", ["Papyrus", "Parchment", "Paper", "Clay tablets"], 0),
                    ("Which two rivers define the region known as Mesopotamia?", ["The Tigris and Euphrates", "The Nile and Jordan", "The Ganges and Indus", "The Yangtze and Yellow"], 0),
                    ("Which ancient wonder was located in Babylon?", ["The Hanging Gardens", "The Colossus of Rhodes", "The Lighthouse of Alexandria", "The Temple of Artemis"], 0),
                    ("The Indus Valley Civilization was located in present-day:", ["Pakistan and northwest India", "Iraq", "Egypt", "China"], 0),
                    ("Which Chinese dynasty began construction of the Great Wall?", ["The Qin Dynasty", "The Ming Dynasty", "The Han Dynasty", "The Tang Dynasty"], 0),
                ],
            },
            {
                "title": "Classical Empires (Greece & Rome)",
                "description": "The rise and legacy of Ancient Greece and Rome.",
                "assignment": {
                    "title": "Rise and Fall of an Empire Report",
                    "description": "Research and summarize the political and social factors behind the rise or fall of a classical empire.",
                },
                "questions": [
                    ("Who was the first Roman Emperor?", ["Augustus", "Julius Caesar", "Nero", "Constantine"], 0),
                    ("Which city-state was known for its military-focused society in Ancient Greece?", ["Sparta", "Athens", "Corinth", "Thebes"], 0),
                    ("What event, traditionally dated to 476 CE, marks the fall of the Western Roman Empire?", ["The deposition of the last Roman emperor", "The founding of Rome", "The Battle of Actium", "The assassination of Caesar"], 0),
                    ("Which Greek philosopher taught Alexander the Great?", ["Aristotle", "Socrates", "Plato", "Pythagoras"], 0),
                    ("What structure did the Romans build for gladiatorial games?", ["The Colosseum", "The Parthenon", "The Pantheon", "The Forum"], 0),
                    ("Which Roman leader crossed the Rubicon, sparking civil war?", ["Julius Caesar", "Augustus", "Pompey", "Nero"], 0),
                    ("The Olympic Games originated in which ancient civilization?", ["Ancient Greece", "Ancient Rome", "Ancient Egypt", "Ancient Persia"], 0),
                    ("What was the Roman Senate primarily responsible for?", ["Advising and helping govern the state", "Religious ceremonies only", "Military drafts only", "Trade regulation only"], 0),
                    ("Which language did the Romans spread across their empire?", ["Latin", "Greek", "Aramaic", "Etruscan"], 0),
                    ("What was the Pax Romana?", ["A long period of relative peace across the Roman Empire", "A Roman legal code", "A religious festival", "A military campaign"], 0),
                ],
            },
            {
                "title": "Medieval & Early Modern World",
                "description": "Feudal Europe, the Renaissance, and the age of exploration.",
                "assignment": {
                    "title": "Medieval Timeline Project",
                    "description": "Create an annotated timeline of five major events from the medieval or early modern period discussed in class.",
                },
                "questions": [
                    ("What system of mutual obligations dominated medieval Europe?", ["Feudalism", "Capitalism", "Democracy", "Communism"], 0),
                    ("Which event in 1492 is significant to world history?", ["Columbus's voyage to the Americas", "The fall of Rome", "The invention of the printing press", "The signing of the Magna Carta"], 0),
                    ("Who is credited with inventing the movable-type printing press in Europe?", ["Johannes Gutenberg", "Leonardo da Vinci", "Galileo Galilei", "Isaac Newton"], 0),
                    ("Which 1215 document limited the power of the English king?", ["The Magna Carta", "The Declaration of Independence", "The Bill of Rights", "The Treaty of Versailles"], 0),
                    ("The Renaissance began in which country?", ["Italy", "France", "England", "Germany"], 0),
                    ("What was the Silk Road primarily used for?", ["Trade between East and West", "Military conquest", "Religious pilgrimage", "Scientific research"], 0),
                    ("Which empire, centered in modern-day Turkey, lasted until the early 20th century?", ["The Ottoman Empire", "The Byzantine Empire", "The Mongol Empire", "The Persian Empire"], 0),
                    ("The Black Death, which devastated 14th-century Europe, was a form of:", ["Plague", "Cholera", "Influenza", "Smallpox"], 0),
                    ("Who founded the Mongol Empire, leading it to its greatest extent?", ["Genghis Khan", "Kublai Khan", "Attila the Hun", "Tamerlane"], 0),
                    ("Which trade route network connected Europe, Asia, and Africa in medieval times?", ["The Silk Road", "The Oregon Trail", "The Trans-Siberian Railway", "The Suez Canal"], 0),
                ],
            },
        ],
    },
    {
        "code": "BIOLOGY101",
        "title": "Biology: Life Sciences Foundations",
        "category": "Academic",
        "description": "Explore the fundamentals of biology, from cell structure to genetics and ecology.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 109,
        "modules": [
            {
                "title": "Cell Biology",
                "description": "Cell structure, organelles, and cellular processes.",
                "assignment": {
                    "title": "Label the Cell Diagram",
                    "description": "Label and describe the function of each organelle in the provided plant and animal cell diagrams.",
                },
                "questions": [
                    ("What is the basic unit of life?", ["The cell", "The atom", "The organ", "The tissue"], 0),
                    ("Which organelle is known as the 'powerhouse of the cell'?", ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"], 0),
                    ("What structure controls what enters and exits a cell?", ["The cell membrane", "The cell wall", "The nucleus", "The cytoplasm"], 0),
                    ("Which type of cell lacks a nucleus?", ["Prokaryotic cell", "Eukaryotic cell", "Plant cell", "Animal cell"], 0),
                    ("What is the function of ribosomes?", ["Protein synthesis", "Energy production", "Waste removal", "Cell division"], 0),
                    ("Which organelle contains the cell's genetic material?", ["Nucleus", "Mitochondria", "Lysosome", "Vacuole"], 0),
                    ("What process do plant cells use to convert sunlight into energy?", ["Photosynthesis", "Respiration", "Fermentation", "Osmosis"], 0),
                    ("Which structure is found in plant cells but not animal cells?", ["Cell wall", "Nucleus", "Mitochondria", "Cell membrane"], 0),
                    ("What is the process by which a cell divides into two identical daughter cells?", ["Mitosis", "Meiosis", "Fertilization", "Transcription"], 0),
                    ("Which molecule carries genetic information in most living organisms?", ["DNA", "RNA", "ATP", "Protein"], 0),
                ],
            },
            {
                "title": "Genetics & Heredity",
                "description": "DNA, genes, inheritance patterns, and Mendelian genetics.",
                "assignment": {
                    "title": "Punnett Square Practice",
                    "description": "Complete Punnett square problems to predict offspring genotypes and phenotypes for the given traits.",
                },
                "questions": [
                    ("Who is known as the father of modern genetics?", ["Gregor Mendel", "Charles Darwin", "Louis Pasteur", "James Watson"], 0),
                    ("What is a gene?", ["A segment of DNA that codes for a trait", "A type of cell", "A protein", "A chromosome"], 0),
                    ("What term describes an organism's observable characteristics?", ["Phenotype", "Genotype", "Allele", "Genome"], 0),
                    ("How many chromosomes are typically found in a human somatic cell?", ["46", "23", "44", "48"], 0),
                    ("What is a dominant allele?", ["An allele that masks the effect of a recessive allele", "An allele that is always harmful", "An allele found only in males", "A non-functional gene"], 0),
                    ("Which process creates genetic variation through chromosome shuffling during reproduction?", ["Meiosis", "Mitosis", "Binary fission", "Cloning"], 0),
                    ("What shape is the DNA molecule?", ["A double helix", "A single strand", "A circle", "A triangle"], 0),
                    ("Which scientists are credited with describing the structure of DNA?", ["Watson and Crick", "Mendel and Darwin", "Pasteur and Koch", "Franklin and Curie"], 0),
                    ("What is a mutation?", ["A change in the DNA sequence", "A type of cell division", "A hybrid organism", "A protein fold"], 0),
                    ("What do we call the complete set of genetic material in an organism?", ["Genome", "Phenotype", "Chromosome", "Allele"], 0),
                ],
            },
            {
                "title": "Ecology & Evolution",
                "description": "Ecosystems, natural selection, and biodiversity.",
                "assignment": {
                    "title": "Local Ecosystem Case Study",
                    "description": "Research a local ecosystem and describe its food web, key species, and any observed effects of natural selection.",
                },
                "questions": [
                    ("What is natural selection?", ["The process by which better-adapted organisms survive and reproduce", "The random mixing of genes", "The classification of species", "The study of fossils"], 0),
                    ("Who proposed the theory of evolution by natural selection?", ["Charles Darwin", "Gregor Mendel", "Isaac Newton", "Louis Pasteur"], 0),
                    ("What is an ecosystem?", ["A community of organisms interacting with their environment", "A single species population", "A type of cell", "A food chain only"], 0),
                    ("What term describes organisms that produce their own food?", ["Producers (autotrophs)", "Consumers", "Decomposers", "Predators"], 0),
                    ("What role do decomposers play in an ecosystem?", ["Breaking down dead organisms and recycling nutrients", "Producing energy from sunlight", "Hunting prey", "Competing for territory"], 0),
                    ("What is biodiversity?", ["The variety of life in a particular habitat or ecosystem", "The age of an ecosystem", "The size of a population", "The climate of a region"], 0),
                    ("What is a food chain?", ["A linear sequence showing energy transfer between organisms", "A type of habitat", "A classification system", "A genetic mutation"], 0),
                    ("What term describes species that no longer exist?", ["Extinct", "Endangered", "Invasive", "Dormant"], 0),
                    ("What is symbiosis?", ["A close, long-term interaction between different species", "Competition within the same species", "A type of cell division", "A genetic disorder"], 0),
                    ("Which factor is NOT typically a driver of evolution?", ["Personal preference", "Natural selection", "Genetic drift", "Mutation"], 0),
                ],
            },
        ],
    },
    {
        "code": "BUSINESS101",
        "title": "Business & Entrepreneurship Basics",
        "category": "Professional",
        "description": "Learn the fundamentals of running a business and launching a startup, from planning to marketing and finance.",
        "difficulty": Course.Difficulty.INTERMEDIATE,
        "amount": 159,
        "modules": [
            {
                "title": "Foundations of Business",
                "description": "Core business concepts, structures, and market research.",
                "assignment": {
                    "title": "Draft a One-Page Business Plan",
                    "description": "Outline a one-page business plan for a hypothetical company, including its mission, target market, and revenue model.",
                },
                "questions": [
                    ("What is the primary goal of a for-profit business?", ["To generate profit for its owners/shareholders", "To provide free services", "To avoid taxes", "To eliminate competition"], 0),
                    ("What does 'B2B' stand for in business?", ["Business-to-Business", "Business-to-Buyer", "Brand-to-Brand", "Buyer-to-Business"], 0),
                    ("What is a sole proprietorship?", ["A business owned and run by one person", "A business owned by shareholders", "A government-owned business", "A nonprofit organization"], 0),
                    ("What does a business plan typically outline?", ["The company's goals, strategy, and financial projections", "Only the company's logo", "Employee vacation schedules", "Tax filing deadlines"], 0),
                    ("What is market research used for?", ["Understanding customer needs and market conditions", "Filing legal paperwork", "Hiring employees", "Setting up a website"], 0),
                    ("What does 'revenue' refer to?", ["Total income generated from sales before expenses", "Profit after all expenses", "Total debt of a company", "Employee salaries"], 0),
                    ("What is a competitive advantage?", ["A factor that allows a company to outperform its competitors", "A type of loan", "A government subsidy", "A legal requirement"], 0),
                    ("What is the key difference between a product and a service?", ["A product is tangible, a service is intangible", "They are identical", "A service is always free", "A product cannot be sold"], 0),
                    ("What does a SWOT analysis stand for?", ["Strengths, Weaknesses, Opportunities, Threats", "Sales, Wages, Output, Taxes", "Systems, Workflow, Objectives, Targets", "Supply, Wants, Orders, Trends"], 0),
                    ("What is a target market?", ["The specific group of consumers a business aims to reach", "Every possible consumer", "Only existing customers", "Competitors of the business"], 0),
                ],
            },
            {
                "title": "Entrepreneurship & Startups",
                "description": "Building, funding, and scaling a new venture.",
                "assignment": {
                    "title": "Startup Pitch Deck Outline",
                    "description": "Create a slide-by-slide outline for a startup pitch deck based on an original business idea.",
                },
                "questions": [
                    ("What is a startup?", ["A newly established, innovative business seeking growth", "A government agency", "A nonprofit charity", "An established corporation"], 0),
                    ("What does MVP stand for in a startup context?", ["Minimum Viable Product", "Most Valuable Player", "Maximum Value Proposal", "Managed Venture Partnership"], 0),
                    ("What is venture capital?", ["Funding provided to startups by investors in exchange for equity", "A government loan", "A type of insurance", "A tax refund"], 0),
                    ("What is a 'pitch deck' used for?", ["Presenting a business idea to potential investors", "Tracking employee hours", "Filing taxes", "Managing inventory"], 0),
                    ("What does 'bootstrapping' mean in entrepreneurship?", ["Building a business using personal finances with little outside help", "Borrowing heavily from banks", "Going public immediately", "Outsourcing all operations"], 0),
                    ("What is an 'exit strategy' for a startup founder?", ["A plan for how founders/investors will eventually cash out", "A plan to close the business permanently", "A marketing campaign", "A hiring plan"], 0),
                    ("What does 'equity' represent in a company?", ["An ownership stake in the company", "A type of debt", "A tax category", "An employee benefit"], 0),
                    ("What is a 'unicorn' in startup terminology?", ["A privately held startup valued at over $1 billion", "A failed startup", "A publicly traded company", "A nonprofit"], 0),
                    ("What is the purpose of a Non-Disclosure Agreement (NDA)?", ["To protect confidential information shared between parties", "To set employee salaries", "To register a trademark", "To file taxes"], 0),
                    ("What does 'scaling a business' mean?", ["Growing a business's operations and revenue efficiently", "Reducing the size of a business", "Closing unprofitable branches", "Changing a business's legal name"], 0),
                ],
            },
            {
                "title": "Marketing & Finance Basics",
                "description": "Marketing fundamentals and essential financial concepts.",
                "assignment": {
                    "title": "Marketing & Budget Plan",
                    "description": "Develop a simple marketing plan and monthly budget for a small business, applying the 4 Ps and break-even concepts.",
                },
                "questions": [
                    ("What are the '4 Ps' of marketing?", ["Product, Price, Place, Promotion", "People, Process, Physical Evidence, Positioning", "Profit, Planning, Performance, Partnership", "Plan, Progress, Purpose, Priority"], 0),
                    ("What is a 'break-even point'?", ["The point at which total revenue equals total costs", "The point of maximum profit", "The start of a business", "The point of bankruptcy"], 0),
                    ("What does ROI stand for?", ["Return on Investment", "Rate of Interest", "Revenue over Income", "Risk of Investment"], 0),
                    ("What is a balance sheet used to show?", ["A company's assets, liabilities, and equity at a point in time", "Daily cash transactions", "Employee performance", "Marketing campaign results"], 0),
                    ("What is 'net profit'?", ["Revenue minus all expenses", "Total revenue", "Total expenses", "Gross sales"], 0),
                    ("What does 'branding' primarily establish for a company?", ["A recognizable identity and reputation", "A legal structure", "A tax bracket", "A physical location"], 0),
                    ("What is 'cash flow'?", ["The movement of money in and out of a business", "The total value of a company", "A type of loan", "A marketing metric"], 0),
                    ("What is a 'target audience' in marketing?", ["The specific group most likely to want a product or service", "Every person in the world", "Only current employees", "Competitors"], 0),
                    ("What does 'digital marketing' primarily use to reach customers?", ["Online channels such as social media and search engines", "Print newspapers only", "Door-to-door sales only", "Radio only"], 0),
                    ("What is a 'budget' in financial planning?", ["A plan for managing income and expenses over a period", "A type of tax", "A legal contract", "A marketing slogan"], 0),
                ],
            },
        ],
    },
    {
        "code": "WRITING101",
        "title": "Academic Writing & Communication Skills",
        "category": "Academic",
        "description": "Strengthen grammar, essay writing, and public speaking skills for academic and professional success.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 79,
        "modules": [
            {
                "title": "Grammar & Sentence Structure",
                "description": "Parts of speech, sentence construction, and common grammar rules.",
                "assignment": {
                    "title": "Sentence Structure Correction Exercise",
                    "description": "Identify and correct grammar and sentence-structure errors in the provided practice paragraphs.",
                },
                "questions": [
                    ("What is a noun?", ["A word that names a person, place, thing, or idea", "A word that describes an action", "A word that connects clauses", "A word that modifies a noun"], 0),
                    ("Which part of speech describes or modifies a noun?", ["Adjective", "Verb", "Adverb", "Conjunction"], 0),
                    ("What is a complete sentence required to have?", ["A subject and a predicate", "Only a subject", "Only a verb", "A question mark"], 0),
                    ("What is a 'run-on sentence'?", ["Two or more independent clauses joined without proper punctuation", "A sentence with no verb", "A very short sentence", "A question"], 0),
                    ("Which punctuation mark joins two independent clauses with a coordinating conjunction?", ["A comma", "A semicolon", "A colon", "A hyphen"], 0),
                    ("What is the correct term for words like 'and', 'but', and 'or'?", ["Conjunctions", "Prepositions", "Pronouns", "Interjections"], 0),
                    ("Which of these is an example of a proper noun?", ["Paris", "City", "Country", "River"], 0),
                    ("What does a semicolon typically connect?", ["Two closely related independent clauses", "A list of single words", "A question and an answer", "A title and subtitle"], 0),
                    ("What is the passive voice typically used for?", ["Emphasizing the action or receiver rather than who performed it", "Making sentences shorter", "Avoiding punctuation", "Listing items"], 0),
                    ("Which word is a pronoun?", ["She", "Run", "Quickly", "Beautiful"], 0),
                ],
            },
            {
                "title": "Essay Structure & Argumentation",
                "description": "Building well-structured, evidence-based essays.",
                "assignment": {
                    "title": "Persuasive Essay Draft",
                    "description": "Write a persuasive essay with a clear thesis, supporting evidence, and a counterargument on a topic of your choice.",
                },
                "questions": [
                    ("What is a thesis statement?", ["A sentence that states the main argument of an essay", "The title of an essay", "A citation", "A summary of sources"], 0),
                    ("What is the purpose of a topic sentence in a paragraph?", ["To introduce the main idea of that paragraph", "To conclude the essay", "To cite a source", "To ask a question"], 0),
                    ("What are the three main parts of a standard essay?", ["Introduction, body, conclusion", "Title, abstract, references", "Hook, thesis, citation", "Summary, argument, rebuttal"], 0),
                    ("What is a 'counterargument' used for in persuasive writing?", ["Addressing opposing viewpoints to strengthen your position", "Repeating your main point", "Citing statistics only", "Concluding the essay"], 0),
                    ("What is 'evidence' in an argumentative essay?", ["Facts, data, or examples that support a claim", "Personal opinions only", "The essay's title", "A list of sources with no context"], 0),
                    ("What does 'plagiarism' mean?", ["Presenting someone else's work or ideas as your own without credit", "Quoting a source with citation", "Summarizing a text", "Paraphrasing correctly"], 0),
                    ("What is the purpose of a conclusion paragraph?", ["To summarize the main points and restate the thesis", "To introduce new arguments", "To cite all sources", "To ask rhetorical questions only"], 0),
                    ("Which citation style is commonly used in the social sciences?", ["APA", "None", "Only footnotes", "Only endnotes"], 0),
                    ("What is a 'hook' in essay writing?", ["An opening line designed to grab the reader's attention", "The essay's final sentence", "A type of citation", "A grammar rule"], 0),
                    ("What does it mean to 'paraphrase' a source?", ["Restating information in your own words while keeping the meaning", "Copying text word-for-word", "Ignoring the source", "Quoting without citation"], 0),
                ],
            },
            {
                "title": "Public Speaking & Presentation Skills",
                "description": "Delivering clear, confident presentations and speeches.",
                "assignment": {
                    "title": "Record a 3-Minute Presentation",
                    "description": "Prepare and deliver a short presentation on a topic of your choice, then reflect on your use of tone, pacing, and body language.",
                },
                "questions": [
                    ("What is the primary purpose of eye contact during a speech?", ["To engage and connect with the audience", "To read notes", "To avoid distractions", "To time the speech"], 0),
                    ("What is 'active listening'?", ["Fully concentrating on and engaging with a speaker", "Hearing sounds passively", "Reading body language only", "Interrupting frequently"], 0),
                    ("Which technique helps reduce public speaking anxiety?", ["Practicing and preparing thoroughly", "Avoiding preparation", "Speaking as fast as possible", "Ignoring the audience"], 0),
                    ("What is the purpose of visual aids in a presentation?", ["To support and clarify the spoken content", "To replace the speaker entirely", "To fill time", "To confuse the audience"], 0),
                    ("What does 'tone' refer to in communication?", ["The attitude or emotion conveyed through speech or writing", "The volume of speech only", "The length of a speech", "The topic of a speech"], 0),
                    ("What is 'body language'?", ["Nonverbal communication through gestures, posture, and expressions", "Written communication", "A type of speech outline", "A citation format"], 0),
                    ("Why is audience analysis important before a presentation?", ["It helps tailor the content and tone to the audience's needs", "It determines the room's temperature", "It sets the presentation's length automatically", "It is not important"], 0),
                    ("What is an 'impromptu speech'?", ["A speech given with little or no preparation", "A heavily scripted speech", "A written essay", "A group discussion"], 0),
                    ("What does 'pacing' refer to in public speaking?", ["The speed and rhythm at which someone speaks", "The size of the venue", "The number of slides used", "The length of the introduction"], 0),
                    ("What is the purpose of a call-to-action at the end of a persuasive speech?", ["To prompt the audience to take a specific action", "To end the speech abruptly", "To summarize only facts", "To introduce a new topic"], 0),
                ],
            },
        ],
    },
    {
        "code": "ATHLETIC101",
        "title": "Athletic Performance & Sports Psychology",
        "category": "Athletic",
        "description": "Training principles, recovery science, and mental performance strategies for competitive student-athletes.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 139,
        "modules": [
            {
                "title": "Training Principles & Physical Conditioning",
                "description": "Core strength, conditioning, and periodization concepts for athletic development.",
                "assignment": {
                    "title": "Design a Weekly Training Split",
                    "description": "Create a sample weekly training schedule that balances strength, conditioning, and rest for a sport of your choice.",
                },
                "questions": [
                    ("What is the term for gradually increasing training demands over time to improve fitness?", ["Progressive overload", "Detraining", "Overtraining", "Tapering"], 0),
                    ("What is the primary purpose of a warm-up before exercise?", ["Prepare muscles and joints and reduce injury risk", "Burn the maximum number of calories", "Build maximum strength", "Replace stretching entirely"], 0),
                    ("Which type of training focuses on short bursts of maximum effort?", ["Anaerobic training", "Aerobic training", "Static stretching", "Passive recovery"], 0),
                    ("What does 'periodization' refer to in athletic training?", ["Structured, planned variation of training over time", "Random daily workouts", "Only competing in the off-season", "Skipping rest days"], 0),
                    ("Which macronutrient is the body's primary energy source during high-intensity exercise?", ["Carbohydrates", "Vitamins", "Minerals", "Water"], 0),
                    ("What is the recommended first response to a sports injury with pain and swelling?", ["Rest, ice, compression, and elevation (RICE)", "Continue training through the pain", "Apply heat immediately", "Ignore it"], 0),
                    ("What is 'VO2 max' a measure of?", ["The body's maximum oxygen consumption during exercise", "Muscle mass percentage", "Reaction time", "Flexibility"], 0),
                    ("Why is sleep important for athletic performance?", ["It supports muscle recovery and cognitive function", "It has no effect on performance", "It only affects mood", "It replaces the need for nutrition"], 0),
                    ("What is 'overtraining syndrome'?", ["A decline in performance from excessive training without adequate recovery", "A technique to build muscle faster", "A type of stretching", "A nutrition plan"], 0),
                    ("Which of these is a component of overall physical fitness?", ["Muscular endurance", "Only speed", "Only strength", "Only flexibility"], 0),
                ],
            },
            {
                "title": "Recovery, Nutrition & Injury Prevention",
                "description": "Recovery science, sports nutrition basics, and strategies to reduce injury risk.",
                "assignment": {
                    "title": "Build a Recovery & Nutrition Plan",
                    "description": "Create a one-week recovery and nutrition plan supporting a heavy training schedule, including sleep, hydration, and meal timing.",
                },
                "questions": [
                    ("What is the main purpose of active recovery?", ["Promote blood flow and reduce muscle soreness through light activity", "Maximize training intensity", "Replace all rest days", "Build maximum strength"], 0),
                    ("Why is hydration important for athletic performance?", ["It regulates body temperature and supports muscle function", "It has no impact on performance", "It only affects taste preferences", "It replaces the need for carbohydrates"], 0),
                    ("What is the purpose of dynamic stretching before a workout?", ["Increase range of motion and prepare muscles for activity", "Permanently increase flexibility", "Replace a warm-up entirely", "Cool down the body"], 0),
                    ("Which nutrient is essential for muscle repair and growth?", ["Protein", "Sugar", "Sodium", "Caffeine"], 0),
                    ("What does 'DOMS' stand for in exercise science?", ["Delayed Onset Muscle Soreness", "Direct Overload Muscle Strain", "Daily Optimal Movement Schedule", "Dynamic Output Muscle System"], 0),
                    ("What is a common cause of overuse injuries in athletes?", ["Repetitive stress without adequate rest", "Too much sleep", "Excessive hydration", "Balanced nutrition"], 0),
                    ("What role does sleep play in injury prevention?", ["It supports tissue repair and reduces fatigue-related injury risk", "It has no effect", "It only affects mood", "It replaces the need for stretching"], 0),
                    ("What is the purpose of a cool-down after intense exercise?", ["Gradually lower heart rate and aid recovery", "Increase maximum heart rate", "Build muscle mass immediately", "Replace a rest day"], 0),
                    ("Which of these is a sign of dehydration during exercise?", ["Dark-colored urine and fatigue", "Increased energy", "Improved focus", "Faster reaction time"], 0),
                    ("What is 'cross-training'?", ["Participating in different types of exercise to improve fitness and reduce overuse injury", "Training only one muscle group", "Skipping training entirely", "Training exclusively at maximum intensity"], 0),
                ],
            },
            {
                "title": "Sports Psychology & Mental Performance",
                "description": "Mental preparation, focus, and resilience strategies used by competitive athletes.",
                "assignment": {
                    "title": "Create a Pre-Competition Mental Routine",
                    "description": "Design a personal pre-competition mental preparation routine, including visualization, breathing, and focus techniques.",
                },
                "questions": [
                    ("What is 'visualization' in sports psychology?", ["Mentally rehearsing a performance before it happens", "Watching game film only", "A type of physical warm-up", "A nutrition strategy"], 0),
                    ("What does 'mental toughness' primarily help an athlete do?", ["Maintain focus and composure under pressure", "Increase muscle mass", "Improve flexibility", "Reduce training volume"], 0),
                    ("What is a common technique used to reduce competition anxiety?", ["Controlled breathing exercises", "Skipping warm-up", "Overtraining", "Avoiding practice"], 0),
                    ("What is 'goal setting' used for in athletic development?", ["Providing clear, measurable targets to guide training and motivation", "Replacing the need for practice", "Only for professional athletes", "Determining game schedules"], 0),
                    ("What does 'self-talk' refer to in sports psychology?", ["The internal dialogue an athlete has that can influence confidence and performance", "A form of stretching", "A type of team strategy", "A nutrition plan"], 0),
                    ("What is 'flow state' (or being 'in the zone')?", ["A mental state of complete focus and immersion in performance", "A state of exhaustion", "A type of injury", "A recovery technique"], 0),
                    ("Why is resilience important for athletes?", ["It helps them recover mentally from setbacks and failures", "It replaces physical training", "It guarantees winning", "It reduces the need for coaching"], 0),
                    ("What is a SMART goal?", ["Specific, Measurable, Achievable, Relevant, Time-bound", "Simple, Motivating, Aggressive, Realistic, Tough", "Strategic, Meaningful, Adaptive, Regular, Timed", "Strong, Mental, Athletic, Ready, Trained"], 0),
                    ("What is 'performance anxiety'?", ["Excessive nervousness or fear that can negatively affect performance", "A physical injury", "A type of overtraining", "A nutrition deficiency"], 0),
                    ("How can a pre-performance routine benefit an athlete?", ["It creates consistency and helps manage nerves before competing", "It guarantees a win", "It replaces physical training", "It is only useful for beginners"], 0),
                ],
            },
        ],
    },
    {
        "code": "NIL101",
        "title": "NIL & Student-Athlete Branding",
        "category": "Athletic",
        "description": "Practical guidance on Name, Image, and Likeness (NIL) opportunities, personal branding, and the recruiting process for student-athletes.",
        "difficulty": Course.Difficulty.INTERMEDIATE,
        "amount": 169,
        "modules": [
            {
                "title": "Understanding NIL & Recruiting Basics",
                "description": "The fundamentals of NIL rules and the college athletic recruiting process.",
                "assignment": {
                    "title": "Recruiting Profile Audit",
                    "description": "Review a sample athletic recruiting profile (or your own) and list three specific improvements based on what recruiters look for.",
                },
                "questions": [
                    ("What does 'NIL' stand for in college athletics?", ["Name, Image, and Likeness", "National Intercollegiate League", "New Institutional License", "National Individual Licensing"], 0),
                    ("What did NIL rules allow college athletes to do starting in 2021?", ["Earn compensation for their name, image, and likeness", "Receive a university salary", "Skip academic requirements", "Transfer without restrictions"], 0),
                    ("What is a common way athletes monetize their NIL rights?", ["Sponsorship and endorsement deals", "Receiving a base team salary", "Selling team equity", "Government grants"], 0),
                    ("What organization has historically governed college athletics eligibility rules in the U.S.?", ["NCAA", "FIFA", "NFL", "IOC"], 0),
                    ("What is a 'recruiting profile' used for?", ["Showcasing an athlete's skills and stats to college coaches", "Filing taxes", "Applying for financial aid", "Renewing eligibility"], 0),
                    ("Why is highlight video quality important in recruiting?", ["It's often a coach's first impression of an athlete's ability", "It has no effect on recruiting", "It replaces academic transcripts", "It is required by law"], 0),
                    ("What is an athletic scholarship?", ["Financial aid awarded based on athletic ability", "A type of student loan", "A tax credit", "A government stipend"], 0),
                    ("What does it mean to 'walk on' to a college team?", ["Joining a team without an athletic scholarship", "Transferring schools", "Retiring from a sport", "Becoming a team captain"], 0),
                    ("What should student-athletes research before signing an NIL deal?", ["The terms, obligations, and any eligibility implications", "Only the payment amount", "Nothing — it's automatically approved", "The team's win-loss record"], 0),
                    ("What is a key benefit of building an athletic resume/portfolio early?", ["It helps track achievements and support recruiting or NIL opportunities", "It guarantees a scholarship", "It replaces game performance", "It is only useful after graduation"], 0),
                ],
            },
            {
                "title": "Personal Branding for Athletes",
                "description": "Building an authentic personal brand and managing a professional social media presence.",
                "assignment": {
                    "title": "Draft a Personal Brand Statement",
                    "description": "Write a one-paragraph personal brand statement and outline three social media content ideas that reflect your athletic identity and values.",
                },
                "questions": [
                    ("What is a 'personal brand'?", ["The public perception and reputation an individual builds around their identity and values", "A type of contract", "A team logo", "A nutrition plan"], 0),
                    ("Why is consistency important across social media platforms for an athlete's brand?", ["It reinforces a clear, recognizable identity", "It has no impact on brand perception", "It is only relevant for professional athletes", "It replaces the need for good performance"], 0),
                    ("What is a 'content calendar' used for?", ["Planning and scheduling social media posts in advance", "Tracking game statistics", "Filing legal documents", "Managing a training schedule"], 0),
                    ("What should athletes consider before posting on social media?", ["How the content reflects on their personal brand and eligibility", "Only how many likes it will get", "Nothing — all posts are safe", "Only their teammates' opinions"], 0),
                    ("What is an 'audit' of a social media footprint used for?", ["Reviewing past posts for anything that could harm reputation or opportunities", "Increasing follower count instantly", "Deleting an account", "Filing taxes"], 0),
                    ("What is 'engagement rate' in social media marketing?", ["A measure of how audiences interact with content relative to reach", "The total number of followers", "The number of posts per day", "A type of payment"], 0),
                    ("Why might a brand look at engagement rate rather than just follower count for an NIL deal?", ["It better reflects genuine audience interest and influence", "It's the only metric available", "Follower count is irrelevant to marketing", "Engagement rate determines eligibility"], 0),
                    ("What is a professional bio typically used for?", ["Summarizing an individual's background, achievements, and identity for public use", "Filing legal paperwork", "Applying for financial aid", "Scheduling practices"], 0),
                    ("Why is 'authenticity' considered important in personal branding?", ["It builds trust and a genuine connection with an audience", "It increases post frequency only", "It replaces hard work", "It meets a legal requirement"], 0),
                    ("What is one risk of posting controversial content as a student-athlete?", ["It could damage sponsorship opportunities and team reputation", "It always increases followers with no downside", "It has no effect on opportunities", "It is required for NIL deals"], 0),
                ],
            },
            {
                "title": "Business & Contract Basics for Athletes",
                "description": "Foundational business, tax, and contract literacy for student-athletes pursuing NIL opportunities.",
                "assignment": {
                    "title": "Contract Red-Flag Checklist",
                    "description": "Create a checklist of at least five things a student-athlete should review before signing an NIL or endorsement contract.",
                },
                "questions": [
                    ("What is the purpose of a written contract in an NIL deal?", ["To clearly define the obligations and compensation of each party", "To make the deal illegal", "To avoid paying taxes", "To guarantee media coverage"], 0),
                    ("Why might a student-athlete consider forming a business entity, such as an LLC, for NIL income?", ["To help separate personal and business finances and manage liability", "To avoid all taxes entirely", "To make the income invalid", "To become ineligible to compete"], 0),
                    ("What is a common reason to consult a lawyer or advisor before signing an NIL deal?", ["To understand contract terms and avoid unfavorable obligations", "Lawyers are required by law for every deal", "To increase the deal's payment automatically", "To make the deal public"], 0),
                    ("What does 'exclusivity' mean in an endorsement contract?", ["The athlete agrees not to endorse competing brands during the deal", "The brand pays double", "The contract has no end date", "The athlete can promote any competitor freely"], 0),
                    ("Why is it important to track NIL income for tax purposes?", ["NIL earnings are generally taxable income that must be reported", "NIL income is never taxed", "Only cash payments count as income", "Tracking is optional and has no consequences"], 0),
                    ("What is a 'morals clause' in an endorsement contract?", ["A clause allowing termination if the athlete's conduct harms the brand's reputation", "A clause guaranteeing payment regardless of conduct", "A clause about game statistics", "A clause unrelated to behavior"], 0),
                    ("What should an athlete check regarding contract length and termination terms?", ["How long the agreement lasts and how either party can exit it", "Only the payment amount", "Nothing — contracts cannot be terminated", "The color scheme of marketing materials"], 0),
                    ("What is 'compensation in kind' in an NIL deal?", ["Payment through goods or services rather than cash", "A type of penalty", "A tax exemption", "A recruiting violation"], 0),
                    ("Why should an athlete keep copies of all signed agreements?", ["To have a record of obligations and protect against future disputes", "Contracts are not legally binding otherwise", "It's required to remain eligible to play", "Copies are not necessary once signed"], 0),
                    ("What is a general best practice before agreeing to any NIL or endorsement deal?", ["Read and fully understand every term before signing", "Sign quickly to avoid losing the deal", "Skip reading and trust the other party", "Only verbal agreements are needed"], 0),
                ],
            },
        ],
    },
    {
        "code": "T1-01",
        "title": "NCAA Academic Eligibility 101",
        "category": "Athletic",
        "description": "A complete walkthrough of NCAA academic eligibility requirements for prospective student-athletes — core course requirements, the sliding scale, and amateurism certification.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 49,
        "modules": [
            {
                "title": "Understanding NCAA Eligibility Basics",
                "description": "The core rules every student-athlete and parent needs to know first.",
                "assignment": {
                    "title": "Build Your Eligibility Timeline",
                    "description": "Map your remaining high school semesters against the NCAA core-course requirements and identify which courses you still need and when you will take them.",
                },
                "questions": [
                    ("What is the primary purpose of the NCAA Eligibility Center?", ["Certifying the academic and amateur status of prospective college athletes", "Scheduling college games", "Distributing athletic scholarships directly", "Ranking high school teams"], 0),
                    ("How many NCAA-approved core courses must a Division I recruit complete?", ["16", "10", "20", "24"], 0),
                    ("When should a student-athlete typically register with the NCAA Eligibility Center?", ["Around the start of their junior year of high school", "After graduating college", "In elementary school", "Only after signing with a team"], 0),
                    ("Which subject areas count toward NCAA core courses?", ["English, math, natural/physical science, social science, and world language", "Physical education and study hall", "Elective art courses only", "Any course the school offers"], 0),
                    ("What is a 'core-course GPA'?", ["A GPA calculated only from NCAA-approved core courses", "The same as the overall high school GPA", "A GPA based only on senior year grades", "A GPA that includes athletic performance"], 0),
                    ("Which document must a high school submit so its courses count as NCAA core courses?", ["An NCAA-approved list of courses for that high school", "A team roster", "A coach's recommendation letter", "A stadium safety report"], 0),
                    ("What happens if a recruit does not meet Division I academic standards?", ["They may be ineligible to compete or receive athletics aid as a freshman", "They automatically become a Division III athlete", "Their high school diploma is revoked", "Nothing — standards are optional"], 0),
                    ("Which NCAA division does not use the Eligibility Center's initial-eligibility certification for competition?", ["Division III", "Division I", "Division II", "All divisions require it"], 0),
                    ("Why do transcripts need to be sent directly from the high school?", ["To provide an official, verified record the NCAA can certify", "Students are not allowed to see their own grades", "It reduces the number of core courses required", "It replaces the amateurism questionnaire"], 0),
                    ("What is the safest general strategy for staying academically eligible?", ["Track core-course progress every semester rather than fixing it senior year", "Wait until senior year and retake courses then", "Focus only on athletic performance", "Assume the coach will handle eligibility"], 0),
                ],
            },
            {
                "title": "The Sliding Scale and Amateurism",
                "description": "How GPA and test scores combine, and how to certify your amateur status.",
                "assignment": {
                    "title": "Sliding Scale Self-Assessment",
                    "description": "Using your current core-course GPA, locate your position on the NCAA sliding scale and write a short plan for the grades you need in your remaining core courses.",
                },
                "questions": [
                    ("What does the NCAA 'sliding scale' relate to each other?", ["Core-course GPA and standardized test scores", "Height and weight", "Team wins and scholarship value", "Attendance and graduation date"], 0),
                    ("On a sliding scale, what happens if a recruit's core-course GPA is lower?", ["A higher test score is generally required", "The GPA requirement is waived", "The core-course count drops to 10", "Nothing changes"], 0),
                    ("What is 'amateurism certification'?", ["Confirmation that an athlete has not violated rules on pay for athletic participation", "A physical fitness test", "A academic tutoring program", "A scholarship application"], 0),
                    ("Which of these has historically been an amateurism concern for recruits?", ["Accepting pay or benefits based on athletic skill from a non-permitted source", "Playing on a high school team", "Attending a college campus tour", "Taking an AP class"], 0),
                    ("What is an 'academic redshirt' status in Division I?", ["A status allowing aid and practice but not competition in the first year", "A permanent ban from college sports", "A guaranteed starting position", "An award for academic excellence"], 0),
                    ("Why is the amateurism questionnaire part of the Eligibility Center process?", ["It collects the competition and compensation history the NCAA reviews", "It measures athletic ability", "It replaces the transcript", "It sets scholarship amounts"], 0),
                    ("Which record should an athlete keep about outside teams they played for?", ["Team names, seasons, and any expenses or benefits received", "Only the team colors", "Nothing needs to be recorded", "Only the final scores"], 0),
                    ("How do NIL earnings differ from traditional amateurism violations?", ["NIL compensation is permitted under current rules within specific requirements", "NIL earnings are always a violation", "NIL earnings are identical to pay-for-play", "NIL rules apply only to professionals"], 0),
                    ("What should a recruit do before signing any agreement involving their athletic participation?", ["Confirm compliance with NCAA and school rules first", "Sign immediately to secure the money", "Ignore it — agreements do not affect eligibility", "Only tell their teammates"], 0),
                    ("What is the most reliable source for current eligibility standards?", ["The NCAA Eligibility Center's official published requirements", "Social media rumors", "A teammate's recollection", "An unofficial fan forum"], 0),
                ],
            },
        ],
    },
    {
        "code": "T1-02",
        "title": "Transcript Optimization",
        "category": "Athletic",
        "description": "Learn how college coaches and admissions officers actually read a high school transcript — GPA weighting, course rigor signals, and realistic strategies for improving a weak record.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 49,
        "modules": [
            {
                "title": "How Coaches Read a Transcript",
                "description": "What actually stands out to a recruiter skimming hundreds of transcripts.",
                "assignment": {
                    "title": "Transcript Self-Audit",
                    "description": "Review your own transcript and write a one-page summary of its strongest signal, its weakest signal, and the single change that would improve it most.",
                },
                "questions": [
                    ("What is the difference between a weighted and an unweighted GPA?", ["A weighted GPA gives extra points for advanced courses; an unweighted one does not", "They are calculated identically", "An unweighted GPA includes athletics", "A weighted GPA excludes core courses"], 0),
                    ("What does 'course rigor' refer to on a transcript?", ["The difficulty level of the courses a student chose to take", "The number of absences", "The student's class rank only", "The size of the school"], 0),
                    ("Why might a recruiter value an upward grade trend?", ["It signals growth, maturity, and the ability to handle harder coursework", "Grade trends are never considered", "It reduces the core-course requirement", "It replaces test scores"], 0),
                    ("Which typically signals stronger academic preparation?", ["A B in an honors or AP course", "An A in a study hall", "A pass in physical education", "A withdrawn course"], 0),
                    ("What does a 'W' or withdrawal on a transcript usually indicate?", ["A course was dropped after enrollment", "A course was passed with honors", "A perfect attendance record", "A transfer credit"], 0),
                    ("Why is consistency across semesters important on a transcript?", ["It shows sustained effort rather than a single strong term", "Only the final semester is reviewed", "Consistency lowers the GPA", "It has no effect"], 0),
                    ("What is class rank?", ["A student's academic standing relative to their graduating class", "A team position", "A test score percentile", "A measure of course rigor"], 0),
                    ("Why do some schools no longer report class rank?", ["To reduce competitive pressure and because it can misrepresent strong cohorts", "Because ranking is illegal", "Because GPAs are no longer calculated", "Because coaches requested it"], 0),
                    ("What should a student do if their transcript contains an error?", ["Contact the school counselor promptly to have it corrected officially", "Edit the copy themselves", "Ignore it", "Send an unofficial version instead"], 0),
                    ("Which pairing best supports a competitive academic profile?", ["Strong core-course grades combined with demonstrated course rigor", "A high GPA earned entirely in electives", "A single strong semester", "Athletic statistics only"], 0),
                ],
            },
            {
                "title": "Fixing a Weak Transcript",
                "description": "Practical, realistic steps to improve your standing before senior year.",
                "assignment": {
                    "title": "Recovery Plan Draft",
                    "description": "Build a semester-by-semester recovery plan listing the specific courses, grades, and support resources you will use to raise your core-course GPA.",
                },
                "questions": [
                    ("What is generally the most effective time to begin repairing a weak transcript?", ["As early as possible, since each additional semester dilutes past grades less", "The final month of senior year", "After college applications are submitted", "It cannot be repaired"], 0),
                    ("How does retaking a core course usually help?", ["A higher replacement grade can raise the core-course GPA", "It removes the course from the transcript entirely", "It adds an extra core course requirement", "It has no effect on GPA"], 0),
                    ("What is credit recovery?", ["A program allowing a student to re-earn credit for a failed course", "A scholarship type", "A method of skipping a grade", "An athletic waiver"], 0),
                    ("Why should a student verify that an online course is NCAA-approved before enrolling?", ["Unapproved courses will not count toward core-course requirements", "Online courses are always approved", "Approval only affects tuition", "It determines the letter grade"], 0),
                    ("Which is a realistic first step when grades slip?", ["Meeting the counselor and teachers to identify the specific gaps", "Changing schools immediately", "Dropping all hard courses", "Waiting for grades to improve on their own"], 0),
                    ("How can a student demonstrate improvement to a coach mid-year?", ["Sharing an updated official transcript or progress report", "Verbally claiming better grades", "Posting on social media", "Nothing can be shown mid-year"], 0),
                    ("What is a common risk of overloading on advanced courses to fix a transcript?", ["Grades in several courses may drop, worsening the overall record", "It always raises the GPA", "Advanced courses are not counted", "It reduces graduation requirements"], 0),
                    ("Why is summer school sometimes recommended?", ["It offers a focused chance to raise a specific grade or recover a credit", "It replaces the entire transcript", "It removes the need for core courses", "It guarantees eligibility"], 0),
                    ("What role do tutoring and study skills play in transcript recovery?", ["They address the underlying cause rather than just the grade", "They are irrelevant to grades", "They only help athletes", "They replace coursework"], 0),
                    ("What is the most honest way to address a weak semester with a coach?", ["Explain the context briefly and show the concrete plan and progress since", "Hide the semester from the transcript", "Blame the teachers", "Avoid the topic entirely"], 0),
                ],
            },
        ],
    },
    {
        "code": "T1-03",
        "title": "The Perfect Highlight Tape",
        "category": "Athletic",
        "description": "Everything you need to produce a highlight tape that actually gets watched — clip selection, ideal length, sequencing for impact, and how to share it with college coaches.",
        "difficulty": Course.Difficulty.BEGINNER,
        "amount": 39,
        "modules": [
            {
                "title": "Planning Your Highlight Tape",
                "description": "Selecting the right clips before you touch an editing tool.",
                "assignment": {
                    "title": "Draft Your Clip List",
                    "description": "Choose and describe your best clips in the order you would present them, explaining in one sentence what each clip is meant to prove about you as a player.",
                },
                "questions": [
                    ("Roughly how long do most college coaches spend on an initial highlight tape?", ["Under a minute before deciding whether to keep watching", "At least thirty minutes", "A full hour", "They watch every second"], 0),
                    ("Which clips should open a highlight tape?", ["The strongest, most clearly impressive plays", "The weakest plays, saving the best for last", "Warm-up footage", "Team introductions"], 0),
                    ("Why is clip quantity usually less important than clip quality?", ["A short reel of excellent plays holds attention better than a long mixed one", "Coaches count the clips", "Longer tapes rank higher in searches", "Quantity determines eligibility"], 0),
                    ("What should a highlight clip make immediately obvious?", ["Which player on the field is you", "The name of the venue", "The final score", "The weather conditions"], 0),
                    ("Which is the most useful way to identify yourself in a clip?", ["A brief spotlight, arrow, or circle at the start of the play", "Narration over the entire clip", "A logo covering the frame", "No identification at all"], 0),
                    ("Why should clips show the play developing rather than only the result?", ["Coaches evaluate decision-making and positioning, not just the outcome", "Longer clips are required", "It hides mistakes", "Results are irrelevant"], 0),
                    ("What kind of footage generally does not belong on a highlight tape?", ["Plays where your contribution is unclear or minimal", "Your best defensive stops", "Clean, well-framed game action", "Plays that show your athleticism"], 0),
                    ("Why is film from multiple games valuable?", ["It shows consistency rather than one exceptional day", "It makes the tape longer", "It is required by the NCAA", "It reduces editing work"], 0),
                    ("What is the purpose of a short title card at the start of a tape?", ["Presenting name, position, graduation year, and contact details clearly", "Filling time", "Replacing the highlights", "Listing team sponsors"], 0),
                    ("What is the best practice for the raw footage you select from?", ["Keep the highest-quality original files available for editing", "Use screen recordings of social media posts", "Use the most compressed copy available", "Delete originals after one edit"], 0),
                ],
            },
            {
                "title": "Editing and Sharing",
                "description": "Turning your clip selection into a finished, shareable tape.",
                "assignment": {
                    "title": "Publish and Share Your Tape",
                    "description": "Export a finished cut of your highlight tape, publish it to an unlisted or public link, and draft the short email you would send a college coach alongside it.",
                },
                "questions": [
                    ("What is a sensible target length for a first highlight tape?", ["Roughly three to five minutes of concentrated highlights", "Thirty to forty minutes", "Under ten seconds", "Length does not matter"], 0),
                    ("Why is loud background music often discouraged?", ["It can distract from the play and may cause takedowns for copyrighted tracks", "Music is technically impossible to add", "Coaches require silence by rule", "It shortens the video"], 0),
                    ("What is the safest way to host a highlight tape for coaches?", ["A stable link on a well-known video platform that does not expire", "An attachment in every email", "A temporary file-sharing link", "A private device only"], 0),
                    ("What should the video's title and description include?", ["Name, graduation year, position, and key contact information", "Only the sport", "Nothing at all", "A long personal essay"], 0),
                    ("Why should transitions and effects be kept minimal?", ["They slow the pace and distract from the actual play", "Effects are not supported by editors", "Coaches require exactly three effects", "They reduce file size"], 0),
                    ("What is the benefit of putting full game film alongside a highlight tape?", ["It lets interested coaches verify performance across a whole game", "It replaces the highlight tape", "It is required for eligibility", "It shortens evaluation time"], 0),
                    ("How should a tape be updated over a season?", ["Refresh it with stronger recent clips as the season progresses", "Never change it once published", "Delete and restart from scratch weekly", "Only update after graduating"], 0),
                    ("Which export setting generally serves a highlight tape best?", ["A widely compatible high-definition format such as 1080p MP4", "The lowest resolution available", "A raw uncompressed master file", "An audio-only file"], 0),
                    ("What makes an outreach email to a coach effective?", ["A short, specific message with the tape link, position, and academic details", "A long message with no link", "A mass email with no name", "Only a video attachment"], 0),
                    ("What is the final quality check before sharing a tape?", ["Watching it end to end as a coach would, on the device they would use", "Skipping review to publish faster", "Asking a teammate to describe it unseen", "Checking only the first frame"], 0),
                ],
            },
        ],
    },
]

# Pathways shown on the home page — each bundles a themed subset of the courses
# above. `course_codes` order determines PathwayCourse.order (display order).
PATHWAY_DEFS = [
    {
        "key": "parent_homeschool",
        "name": "Parent / Homeschool Pathway",
        "summary": "Guided homeschool curriculum and progress tracking for parents teaching their kids at home.",
        "description": (
            "A curated set of courses for parents managing their child's education at home — "
            "covering core academics, study skills, and progress tracking."
        ),
        "base_price": 199,
        "course_codes": ["ALGEBRA101", "HISTORY101", "BIOLOGY101", "WRITING101"],
    },
    {
        "key": "education_academic",
        "name": "Education / Academic Pathway",
        "summary": "Core academic coursework for students who want a structured, standards-aligned curriculum.",
        "description": (
            "General-purpose academic pathway covering core subjects for students who want a "
            "structured, standards-aligned course of study."
        ),
        "base_price": 179,
        "course_codes": ["ALGEBRA101", "HISTORY101", "BIOLOGY101", "WRITING101", "PYTHON101"],
    },
    {
        "key": "ivy_league",
        "name": "Ivy League-Oriented Pathway",
        "summary": "Advanced coursework and admissions prep for students targeting highly selective universities.",
        "description": (
            "Rigorous, admissions-focused pathway for students aiming for Ivy League or other "
            "highly selective universities — advanced coursework paired with application strategy."
        ),
        "base_price": 299,
        "course_codes": ["ALGEBRA101", "HISTORY101", "BIOLOGY101", "WRITING101", "PYTHON101", "WEBDEV101"],
    },
    {
        "key": "athlete_sports",
        "name": "Athlete / Sports Pathway",
        "summary": "Flexible academics built around a competitive sports schedule for student-athletes.",
        "description": (
            "Pathway designed for student-athletes who need academic flexibility around training "
            "and competition schedules, without falling behind on coursework."
        ),
        "base_price": 249,
        "course_codes": ["ATHLETIC101", "NIL101", "BUSINESS101", "WRITING101"],
    },
    {
        "key": "business",
        "name": "Business Pathway",
        "summary": "Practical business, entrepreneurship, and financial literacy coursework.",
        "description": (
            "Pathway for students interested in business, entrepreneurship, and financial "
            "literacy — practical, real-world-oriented coursework."
        ),
        "base_price": 229,
        "course_codes": ["BUSINESS101", "WEBDEV101", "PYTHON101", "WRITING101"],
    },
    {
        "key": "international_student",
        "name": "International Student Pathway",
        "summary": "Cross-border academic and language support for students studying outside their home country.",
        "description": (
            "Support pathway for international students preparing to study in another country, "
            "including academic and language-readiness coursework."
        ),
        "base_price": 259,
        "course_codes": ["WRITING101", "HISTORY101", "BIOLOGY101", "ALGEBRA101"],
    },
    {
        "key": "the_blueprint",
        "name": "The Blueprint",
        "summary": "Early positioning, academic foundations, and avoiding common pitfalls.",
        "description": (
            "The entry pathway for 8th-10th grade athletes — NCAA eligibility rules, transcript "
            "strategy, and highlight-tape fundamentals, before mistakes become expensive."
        ),
        "base_price": 199,
        "course_codes": ["T1-01", "T1-02", "T1-03"],
    },
    {
        "key": "athletic_recruiting",
        "name": "Athletic Recruiting Readiness Pathway",
        "summary": "NIL literacy and personal branding for athletes entering the recruiting window.",
        "description": (
            "Coursework for upperclassmen athletes navigating recruiting, NIL basics, and "
            "building a personal brand college programs notice."
        ),
        "base_price": 199,
        "course_codes": ["ATHLETIC101", "NIL101", "WRITING101"],
    },
    {
        "key": "trade_vocational",
        "name": "Trade & Vocational Skills Pathway",
        "summary": "Practical business and technical skills for trades, freelancing, and alternative paths.",
        "description": (
            "For students exploring vocational, trade, or entrepreneurial paths instead of a "
            "traditional 4-year degree — practical business and technical foundations."
        ),
        "base_price": 179,
        "course_codes": ["BUSINESS101", "WEBDEV101", "PYTHON101"],
    },
    {
        "key": "elite_athlete_business",
        "name": "Elite Athlete Business Pathway",
        "summary": "NIL, branding, and business fundamentals for college stars and pro-bound athletes.",
        "description": (
            "Advanced NIL contract literacy, personal brand management, and business basics for "
            "athletes at the top of their recruiting class or already competing at the college level."
        ),
        "base_price": 279,
        "course_codes": ["NIL101", "BUSINESS101", "ATHLETIC101"],
    },
    {
        "key": "strategic_analytics",
        "name": "Strategic Analytics Pathway",
        "summary": "Technical and analytical foundations for high-stakes decision-making.",
        "description": (
            "Programming, web literacy, and communication foundations that support structured, "
            "data-informed decision-making."
        ),
        "base_price": 249,
        "course_codes": ["PYTHON101", "WEBDEV101", "WRITING101"],
    },
]

# The nine tiers, in level order. `pathway_keys` are PATHWAY_DEFS keys and their
# list order becomes each TierPathway.order (1-based, per tier). A pathway may
# legitimately appear under more than one tier — TierPathway is a real M2M, not
# a Pathway.tier FK.
TIER_DEFS = [
    {
        "level": 1,
        "name": "The Blueprint",
        "audience": "8th-10th Grade Athletes",
        "focus_description": "Early positioning, academic foundations, and avoiding common pitfalls.",
        "category": "Athletic",
        "estimated_duration": "12 Months",
        "pathway_keys": ["the_blueprint", "athlete_sports"],
    },
    {
        "level": 2,
        "name": "The Parent Playbook",
        "audience": "Parents of Rising Elite Athletes",
        "focus_description": "Managing external pressures, vetting professionals, and protecting the family.",
        "category": "Foundation",
        "estimated_duration": "Ongoing",
        "pathway_keys": ["parent_homeschool"],
    },
    {
        "level": 3,
        "name": "The Recruiting Window",
        "audience": "High School Upperclassmen Athletes and Their Parents (11th-12th Grade)",
        "focus_description": "Securing the offer, official visits, and early NIL preparation.",
        "category": "Athletic",
        "estimated_duration": "8 Months",
        "pathway_keys": ["athletic_recruiting"],
    },
    {
        "level": 4,
        "name": "The Scholar's Foundation",
        "audience": "Ambitious Non-Athlete Students and Their Parents (7th-10th Grade)",
        "focus_description": "Academic excellence, early leadership, tech literacy, and extracurricular strategy.",
        "category": "Academic",
        "estimated_duration": "18 Months",
        "pathway_keys": ["ivy_league", "education_academic"],
    },
    {
        "level": 5,
        "name": "The Career Launchpad",
        "audience": "High School Upperclassmen and College Students (11th Grade - College)",
        "focus_description": "College admissions, internships, networking, and early career placement.",
        "category": "Academic",
        "estimated_duration": "6-9 Months",
        "pathway_keys": ["international_student"],
    },
    {
        "level": 6,
        "name": "The Pathfinder",
        "audience": "11th Grade to Young Adults Exploring Trades, Vocational, or Alternative Paths",
        "focus_description": "Practical life skills, financial independence, career exploration, and self-discovery.",
        "category": "Vocational",
        "estimated_duration": "6 Months",
        "pathway_keys": ["trade_vocational"],
    },
    {
        "level": 7,
        "name": "The Elite Level",
        "audience": "College Stars, Top-100 High School Recruits, and Pro-Bound Athletes",
        "focus_description": "NIL maximization, pro transition, complex contract negotiation, and foundational wealth building.",
        "category": "Athletic",
        "estimated_duration": "Year-Round",
        "pathway_keys": ["elite_athlete_business"],
    },
    {
        "level": 8,
        "name": "The Business Elite Level",
        "audience": "High-Level Corporate Executives, Founders, and Business Leaders",
        "focus_description": "Business scaling, operational efficiency, AI integration, infrastructure building, and strategic resource allocation.",
        "category": "Professional",
        "estimated_duration": "6 Months",
        "pathway_keys": ["business"],
    },
    {
        "level": 9,
        "name": "Critical Thinking",
        "audience": "High-Stakes Decision-Makers Across All Domains",
        "focus_description": "Cognitive biases, mental models, risk assessment, game theory, and strategic execution.",
        "category": "Legacy",
        "estimated_duration": "Custom Iterative",
        "pathway_keys": ["strategic_analytics"],
    },
]

BUNDLE_RULES = [
    {"pathway_count": 2, "discount_percent": 15},
    {"pathway_count": 3, "discount_percent": 25},
    {"pathway_count": 4, "discount_percent": 30},
    {"pathway_count": 5, "discount_percent": 35},
]

# Daily Drill scenarios. `_reset_data` wipes the drill bank along with everything
# else, so it is reseeded here — otherwise the Daily Drill feature would be empty
# after every seed. Each option carries the impact/rationale text the drill result
# screen shows once a student picks it.
DRILL_DEFS = [
    {
        "scenario": (
            "An energy drink brand \"HyperCharge\" offers you a $15,000 NIL contract. However, the "
            "contract contains a non-compete clause that blocks you from wearing or endorsing any "
            "activewear brand, even during official collegiate tournaments which are sponsored by "
            "your varsity equipment sponsor. What is your move?"
        ),
        "guidelines": "Goal: Balance immediate monetization with future flexibility and compliance with institutional athletic rules.",
        "options": [
            {
                "key": "A",
                "text": "Sign immediately. $15k is high upfront liquidity and you can deal with school policy violations later.",
                "impact": "High immediate revenue, but severely compromises athletic eligibility. This could lead to suspensions and violate university licensing covenants.",
                "rationale": "Accepting cash with restrictive covenants that violate school athletic rules leads to suspensions. Immediate cash is wiped out by damage to athlete reputation.",
                "score": 30,
            },
            {
                "key": "B",
                "text": "Reject the offer outright and state that the athletic-wear restrictions make you too big a risk to sign.",
                "impact": "Zero conflict, but also zero revenue. Misses an opportunity to show commercial posture and negotiate better terms.",
                "rationale": "While safe, an elite operator negotiates for mutual fit instead of flat rejection.",
                "score": 60,
            },
            {
                "key": "C",
                "text": "Present a redlined counter-contract excluding official school athletic uniforms from the non-compete scope, capping the restriction to beverage products.",
                "impact": "Demonstrates professional executive posture, protects university compliance standing, and keeps the beverage cash flowing.",
                "rationale": "Perfect deal-making posture. This keeps you in play for your school equipment sponsor and still lands the HyperCharge beverage contract.",
                "score": 100,
            },
        ],
    },
    {
        "scenario": (
            "Your tracking metrics reveal severe sleep debt (averaging 5.4 hours) caused by exam "
            "weeks colliding with 5:30 AM pre-dawn training runs. National scouts visit your camp "
            "in 3 days and your energy is depleted. How do you adjust your schedule?"
        ),
        "guidelines": "Goal: Optimize cognition and muscle recovery while maintaining visibility with the scouting staff.",
        "options": [
            {
                "key": "A",
                "text": "Power through with high-caffeine supplements. Push harder; scouts want to see relentless stamina.",
                "impact": "Heart-rate spikes, nervous fatigue, elevated cortisol, and a real risk of cramps or poor reaction time during scout drills.",
                "rationale": "Pushing through physiological fatigue with stimulants produces a hollow performance and sharply increases injury risk.",
                "score": 40,
            },
            {
                "key": "B",
                "text": "Ask the coaching staff to swap pre-dawn runs for afternoon film sessions, using the mornings for recovery sleep.",
                "impact": "Restores central nervous system recovery and cognitive clarity for the scout drills while keeping playbook knowledge sharp.",
                "rationale": "Recovery is a performance weapon. Afternoon film keeps you visible and compliant while restoring physical output.",
                "score": 100,
            },
            {
                "key": "C",
                "text": "Skip training entirely without telling the staff, claiming sudden illness to guarantee rest.",
                "impact": "Restores physical state but craters trust with the scouting team and head coaches.",
                "rationale": "Uncoordinated absences signal unreliability, a major red flag for scouts evaluating culture fit.",
                "score": 25,
            },
        ],
    },
    {
        "scenario": (
            "An alumnus and business owner offers to fund your tech venture with $50,000, but "
            "requests 45% equity and a veto right over all subsequent funding rounds — before you "
            "have even launched an MVP. He says: \"Take it now, or you will find no other backing "
            "in this town.\" How do you proceed?"
        ),
        "guidelines": "Goal: Secure startup resources without surrendering future venture control or paralyzing the cap table.",
        "options": [
            {
                "key": "A",
                "text": "Accept immediately. $50k is crucial to build the product and start hiring.",
                "impact": "The venture is hyper-diluted and later investors reject the terms because of the alumni veto right.",
                "rationale": "Giving away 45% plus a veto right at pre-seed blocks all future financing agility and turns you into a subsidiary rather than a founder.",
                "score": 35,
            },
            {
                "key": "B",
                "text": "Decline the terms diplomatically and counter with a SAFE at a fair valuation cap, deferring the equity conversion to the next institutional round.",
                "impact": "Preserves cap-table health, keeps funding options open, and signals business maturity.",
                "rationale": "A SAFE keeps governance clean and aligns valuation with standard startup practice, blocking an early predatory takeover.",
                "score": 100,
            },
            {
                "key": "C",
                "text": "Decline and tell the alumnus his terms are predatory and that you will expose his practices across campus networks.",
                "impact": "Protects equity, but burns a powerful institutional bridge and creates toxic noise around your team.",
                "rationale": "Combative communication never yields long-term strategic leverage, even when you are right on the substance.",
                "score": 50,
            },
        ],
    },
    {
        "scenario": (
            "Bidding a major electrical upgrade for an industrial warehouse, a subcontractor submits "
            "a bid 40% below market average but mentions they operate under \"unregistered staff "
            "arrangements\". Winning guarantees high margins but exposes you to regulatory audits. "
            "What is your call?"
        ),
        "guidelines": "Goal: Secure commercial margins while maintaining licensing integrity and occupational safety compliance.",
        "options": [
            {
                "key": "A",
                "text": "Accept the low bid. It secures maximum short-term profit, and regulatory issues sit with the subcontractor.",
                "impact": "Very high immediate margin, but exposes your contractor license to suspension and potential safety liability under audit.",
                "rationale": "Using unregistered labour violates general contractor licensing covenants. Licence suspension far outweighs short-term bid profit.",
                "score": 35,
            },
            {
                "key": "B",
                "text": "Reject the bid outright and work only with premium contractors, even if it makes you uncompetitive locally.",
                "impact": "Maintains perfect compliance standing, but misses the chance to set vendor standards or negotiate conforming terms.",
                "rationale": "Safe, but an elite contractor manages risk proactively and communicates compliance standards rather than rejecting silently.",
                "score": 65,
            },
            {
                "key": "C",
                "text": "Formally request proof of workers' compensation insurance and current field certifications, countering with standard vendor compliance codes.",
                "impact": "Demonstrates professional posture, protects your licensing standing, and forces compliance while keeping the bid live.",
                "rationale": "Formalizing compliance requirements shields your firm from audits while keeping you commercially competitive.",
                "score": 100,
            },
        ],
    },
]

# Onboarding questionnaire used to recommend a pathway. Each option's "weights"
# dict maps a PATHWAY_DEFS "key" -> weight toward that pathway. Every pathway key
# must appear somewhere below, otherwise that pathway can only ever be
# recommended at score 0 (see onboarding/services.compute_pathway_recommendations,
# which ranks every published pathway and falls back to 0 for unweighted ones).
QUESTIONNAIRE = [
    {
        "text": "What best describes your current situation?",
        "options": [
            {"text": "I'm a parent supporting my child's homeschool education", "weights": {"parent_homeschool": 3}},
            {"text": "I'm a student focused on traditional academic coursework", "weights": {"education_academic": 3}},
            {"text": "I'm aiming for Ivy League or other highly selective admissions", "weights": {"ivy_league": 3}},
            {"text": "I'm a competitive student-athlete balancing sports and school", "weights": {"athlete_sports": 3, "the_blueprint": 2}},
            {"text": "I'm an athlete in the middle of the recruiting window (11th-12th grade)", "weights": {"athletic_recruiting": 3, "athlete_sports": 1}},
            {"text": "I'm a college or pro-bound athlete managing NIL opportunities", "weights": {"elite_athlete_business": 3}},
            {"text": "I'm interested in business, entrepreneurship, or finance", "weights": {"business": 3}},
            {"text": "I'm exploring trades, vocational training, or an alternative path", "weights": {"trade_vocational": 3}},
            {"text": "I'm an international student preparing to study abroad", "weights": {"international_student": 3}},
        ],
    },
    {
        "text": "What age range are you focused on?",
        "options": [
            {"text": "Elementary / homeschool age", "weights": {"parent_homeschool": 2}},
            {"text": "Middle school", "weights": {"education_academic": 1, "the_blueprint": 2}},
            {"text": "High school", "weights": {"education_academic": 1, "ivy_league": 1, "athlete_sports": 1, "athletic_recruiting": 1, "trade_vocational": 1}},
            {"text": "College and beyond", "weights": {"business": 1, "international_student": 1, "elite_athlete_business": 1, "strategic_analytics": 1}},
        ],
    },
    {
        "text": "How much time can you commit each week?",
        "options": [
            {"text": "1-2 hours", "weights": {"parent_homeschool": 1}},
            {"text": "3-5 hours", "weights": {"education_academic": 1, "athlete_sports": 1, "trade_vocational": 1}},
            {"text": "5+ hours", "weights": {"ivy_league": 2, "business": 1, "strategic_analytics": 1}},
        ],
    },
    {
        "text": "What's your top academic goal right now?",
        "options": [
            {"text": "Getting into a top-tier or Ivy League university", "weights": {"ivy_league": 3}},
            {"text": "Balancing athletics with strong academics", "weights": {"athlete_sports": 3, "the_blueprint": 1}},
            {"text": "Earning a college athletic offer", "weights": {"athletic_recruiting": 3, "the_blueprint": 2}},
            {"text": "Maximizing NIL and business opportunities as an athlete", "weights": {"elite_athlete_business": 3}},
            {"text": "Building practical business or entrepreneurial skills", "weights": {"business": 3}},
            {"text": "Learning a trade or launching work of my own", "weights": {"trade_vocational": 3}},
            {"text": "Sharpening decision-making and strategic thinking", "weights": {"strategic_analytics": 3}},
            {"text": "Preparing for studying in another country", "weights": {"international_student": 3}},
            {"text": "Staying on track with core school subjects", "weights": {"education_academic": 2}},
        ],
    },
    {
        "text": "Are you currently playing a competitive sport?",
        "options": [
            {"text": "Yes, at a competitive or travel level", "weights": {"athlete_sports": 3, "the_blueprint": 2, "athletic_recruiting": 2, "elite_athlete_business": 1}},
            {"text": "Yes, recreationally", "weights": {"athlete_sports": 1, "the_blueprint": 1}},
            {"text": "No", "weights": {"education_academic": 1}},
        ],
    },
    {
        "text": "Are you studying from outside the country you plan to enroll in?",
        "options": [
            {"text": "Yes, I'm an international or ESL student", "weights": {"international_student": 3}},
            {"text": "No, this doesn't apply to me", "weights": {"education_academic": 1}},
        ],
    },
    {
        "text": "Who is this learning plan primarily for?",
        "options": [
            {"text": "My child (I'm the parent or guardian)", "weights": {"parent_homeschool": 3}},
            {"text": "Myself, as a student", "weights": {"education_academic": 2}},
            {"text": "Myself, as an athlete building a college or pro career", "weights": {"the_blueprint": 2, "athletic_recruiting": 2, "elite_athlete_business": 2}},
            {"text": "Myself, to build career or business skills", "weights": {"business": 2, "trade_vocational": 1}},
        ],
    },
    {
        "text": "What matters most to you in a curriculum?",
        "options": [
            {"text": "Structured, standards-aligned academics", "weights": {"education_academic": 2}},
            {"text": "A competitive edge for elite admissions", "weights": {"ivy_league": 2}},
            {"text": "Flexibility around a sports schedule", "weights": {"athlete_sports": 2}},
            {"text": "A clear roadmap through recruiting and NIL decisions", "weights": {"the_blueprint": 2, "athletic_recruiting": 2, "elite_athlete_business": 2}},
            {"text": "Real-world business and financial literacy", "weights": {"business": 2}},
            {"text": "Hands-on, job-ready technical skills", "weights": {"trade_vocational": 2, "strategic_analytics": 1}},
            {"text": "Sharper judgement under pressure and uncertainty", "weights": {"strategic_analytics": 2}},
            {"text": "Support for a global or cross-border education path", "weights": {"international_student": 2}},
            {"text": "Simplicity and guidance for homeschool parents", "weights": {"parent_homeschool": 2}},
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Wipes EVERY row except the admin account(s), then reseeds a complete, realistic demo "
        "dataset: the six canonical categories, teachers, students, courses (with downloaded "
        "thumbnails and PDF/DOCX lesson files), modules, lessons, assignments, quizzes, pathways, "
        "tiers, bundle pricing rules, the onboarding questionnaire, and the Daily Drill bank. "
        "Admin accounts and superusers are preserved (get_or_create, never deleted) rather than "
        "reset. Student-course enrollments are intentionally NOT seeded — enroll students manually "
        "(e.g. via the admin portal) after seeding. Safe to re-run — every run produces the same "
        "dataset, and media files already on disk are reused rather than re-downloaded. Pass "
        "--noinput to skip the confirmation prompt (e.g. for CI/deploy scripts) and --skip-assets "
        "to seed without network access."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--noinput",
            action="store_true",
            help="Skip the confirmation prompt and seed immediately.",
        )
        parser.add_argument(
            "--skip-assets",
            action="store_true",
            help=(
                "Don't download course thumbnails or lesson PDF/DOCX files. Use when the machine "
                "has no outbound network access — courses and lessons are seeded without media."
            ),
        )

    def handle(self, *args, **options):
        if not options["noinput"]:
            confirm = input(
                "This will DELETE every row except the admin account(s) — teachers, students, "
                "courses, modules, lessons, assignments, quizzes, enrollments, progress, pathways, "
                "tiers, onboarding questions, and daily drills — and reseed fresh demo data. "
                "Students will NOT be auto-enrolled in any course.\n"
                "Type 'yes' to continue: "
            )
            if confirm.strip().lower() != "yes":
                self.stdout.write(self.style.WARNING("Aborted — no changes were made."))
                return

        # Assets are fetched BEFORE the transaction opens, so a dozen-plus network
        # round trips never hold a write transaction open, and an unreachable host
        # degrades to "seeded without that file" instead of rolling the seed back.
        assets = self._download_assets(skip=options["skip_assets"])

        with transaction.atomic():
            self._reset_data()
            self.stdout.write(self.style.WARNING("Cleared existing data (admin preserved)"))

            self._create_admin()
            self.stdout.write(self.style.SUCCESS("Ensured 1 admin"))

            teachers = [
                self._create_user(first, last, f"teacher{i}@example.com", User.Roles.TEACHER)
                for i, (first, last) in enumerate(TEACHER_NAMES, start=1)
            ]
            self.stdout.write(self.style.SUCCESS(f"Created {len(teachers)} teachers"))

            students = [
                self._create_user(first, last, f"student{i}@example.com", User.Roles.STUDENT)
                for i, (first, last) in enumerate(STUDENT_NAMES, start=1)
            ]
            self.stdout.write(self.style.SUCCESS(f"Created {len(students)} students"))

            # Wraps around when there are more courses than teachers, so adding a
            # course def never has to be paired with adding a teacher name.
            teachers_by_code = {
                course_def["code"]: teachers[index % len(teachers)]
                for index, course_def in enumerate(COURSE_DEFS)
            }

            categories = self._create_categories()
            self.stdout.write(self.style.SUCCESS(f"Ensured {len(categories)} categories"))

            courses_by_code = self._create_course_content(categories, teachers_by_code, assets)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created {len(courses_by_code)} courses with modules, lessons, "
                    "assignments, and quizzes"
                )
            )

            pathways_by_key = self._seed_pathways(courses_by_code)
            self.stdout.write(self.style.SUCCESS(f"Created {len(pathways_by_key)} pathways"))

            tiers = self._create_tiers(categories, pathways_by_key)
            self.stdout.write(
                self.style.SUCCESS(f"Created {len(tiers)} tiers with their pathway attachments")
            )

            self._seed_bundle_rules()
            self.stdout.write(self.style.SUCCESS(f"Ensured {len(BUNDLE_RULES)} bundle pricing rule(s)"))

            self._seed_questionnaire(pathways_by_key)
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(QUESTIONNAIRE)} onboarding questions"))

            self._seed_drills()
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(DRILL_DEFS)} daily drill scenarios"))

        self.stdout.write(self.style.SUCCESS("Seed data completed successfully."))

    def _download_assets(self, skip=False):
        """Fetches every course thumbnail and the shared lesson PDF/DOCX into media
        storage and returns the stored paths, keyed for `_create_course_content`
        and `_create_lesson`. Any file that can't be fetched is simply absent from
        the result, and the row that wanted it is seeded without media."""
        assets = {"thumbnails": {}, "lessons": {}}

        if skip:
            self.stdout.write(
                self.style.WARNING("--skip-assets: seeding without thumbnails or lesson files")
            )
            return assets

        for name, url in LESSON_ASSET_URLS.items():
            path = self._store_asset(LESSON_ASSET_PATHS[name], url)
            if path:
                assets["lessons"][name] = path

        for code, url in COURSE_THUMBNAIL_URLS.items():
            path = self._store_asset(f"course_thumbnails/seed-{slugify(code)}.jpg", url)
            if path:
                assets["thumbnails"][code] = path

        self.stdout.write(
            self.style.SUCCESS(
                f"Prepared {len(assets['lessons'])} lesson file(s) and "
                f"{len(assets['thumbnails'])} thumbnail(s) in media storage"
            )
        )
        return assets

    def _store_asset(self, path, url):
        """Downloads `url` to MEDIA_ROOT/<path> once and returns the stored name to
        assign to a FileField/ImageField. A file already on disk is reused, so
        re-seeding neither re-downloads nor accumulates suffixed duplicates the way
        an unconditional `default_storage.save` would (`seed-python101_a1b2c3.jpg`).
        Returns None on any failure — a missing demo file must not abort the seed."""
        if default_storage.exists(path):
            return path

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            self.stdout.write(self.style.WARNING(f"Could not download {url} ({exc}) — skipping."))
            return None

        return default_storage.save(path, ContentFile(response.content))

    def _reset_data(self):
        """Wipes every row except admin accounts and superusers.

        Deleting the non-admin users cascades their enrollments, submissions, quiz
        attempts, progress, cart items, drill attempts, pathway enrollments, and
        onboarding answers; the explicit deletes below cover the same tables for
        rows an admin might own, plus the content that no user owns at all.

        Order matters: Category is PROTECTed by both Course.category and
        Tier.category, so every course and tier has to be gone before categories
        can be cleared.
        """
        User.objects.exclude(role=User.Roles.ADMIN).exclude(is_superuser=True).delete()

        # Learner-activity tables — anything still here belongs to an admin account.
        EnrollmentHistory.objects.all().delete()
        Enrollment.objects.all().delete()
        LessonProgress.objects.all().delete()
        ModuleProgress.objects.all().delete()
        CourseProgress.objects.all().delete()
        LearningActivity.objects.all().delete()
        CartItem.objects.all().delete()
        OnboardingProgress.objects.all().delete()
        PathwayEnrollment.objects.all().delete()
        TierProgress.objects.all().delete()

        # Applications carry their own applicant details rather than an FK to a
        # seeded user, so deleting users doesn't cascade them.
        FutureClientApplication.objects.all().delete()
        DrillQuestion.objects.all().delete()

        Course.objects.all().delete()
        Tier.objects.all().delete()
        Pathway.objects.all().delete()
        OnboardingQuestion.objects.all().delete()
        PathwayBundleRule.objects.all().delete()

        Category.objects.all().delete()
        Tag.objects.all().delete()

    def _create_admin(self):
        user, created = User.objects.get_or_create(
            email=ADMIN_DATA["email"],
            defaults={
                "username": ADMIN_DATA["email"],
                "first_name": ADMIN_DATA["first_name"],
                "last_name": ADMIN_DATA["last_name"],
                "gender": User.Gender.OTHER,
                "role": User.Roles.ADMIN,
                "is_verified": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password("Password@123")
            user.save(update_fields=["password"])
        return user

    def _create_user(self, first_name, last_name, email, role):
        # Teachers/students are always wiped in `_reset_data` before this runs, so this
        # always creates fresh — DEFAULT_PASSWORD is applied on every seed run, per the
        # explicit request that every seeded teacher/student use it.
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": first_name,
                "last_name": last_name,
                "gender": User.Gender.OTHER,
                "role": role,
                "is_verified": True,
            },
        )
        if created:
            user.set_password(DEFAULT_PASSWORD)
            user.save(update_fields=["password"])
        return user

    def _create_categories(self):
        categories = {name: Category.objects.get_or_create(name=name)[0] for name in CATEGORY_NAMES}

        # Guards against a new course or tier def quietly reintroducing a seventh
        # category and re-splitting the vocabulary courses.0004 consolidated.
        referenced = {course_def["category"] for course_def in COURSE_DEFS}
        referenced |= {tier_def["category"] for tier_def in TIER_DEFS}
        unknown = sorted(referenced - set(categories))
        if unknown:
            raise CommandError(
                "Seed definitions reference categories that are not in CATEGORY_NAMES: "
                + ", ".join(unknown)
            )

        return categories

    def _create_course_content(self, categories, teachers_by_code, assets):
        courses_by_code = {}
        for course_def in COURSE_DEFS:
            course, _ = Course.objects.get_or_create(
                code=course_def["code"],
                defaults={
                    "title": course_def["title"],
                    "description": course_def["description"],
                    "category": categories[course_def["category"]],
                    "thumbnail": assets["thumbnails"].get(course_def["code"]) or "",
                    "status": Status.PUBLISHED,
                    "difficulty": course_def["difficulty"],
                    "amount": course_def["amount"],
                },
            )
            courses_by_code[course_def["code"]] = course

            teacher = teachers_by_code[course_def["code"]]
            CourseInstructor.objects.update_or_create(
                course=course, instructor=teacher, defaults={"is_lead": True}
            )

            for module_order, module_def in enumerate(course_def["modules"], start=1):
                module, _ = Module.objects.get_or_create(
                    course=course,
                    title=module_def["title"],
                    defaults={"description": module_def["description"], "order": module_order},
                )

                for lesson_order, content_type in enumerate(LESSON_TYPE_CYCLE, start=1):
                    self._create_lesson(
                        module, module_def["title"], content_type, lesson_order, assets["lessons"]
                    )

                self._create_assignment(module, course, module_def["assignment"], teacher, module_order)
                self._create_quiz(module, course, module_def["title"], module_def["questions"])

        return courses_by_code

    def _create_lesson(self, module, module_title, content_type, order, lesson_assets):
        label = LESSON_TYPE_LABELS[content_type]
        spec = LESSON_TYPE_CONTENT[content_type]
        Lesson.objects.get_or_create(
            module=module,
            title=f"{module_title} — {label}",
            defaults={
                "description": f"{label} for {module_title}.",
                "content_type": content_type,
                "content_data": spec["content_data"],
                "video_url": spec["video_url"],
                # VIDEO lessons carry a video_url instead, so `asset` is None there.
                "file": lesson_assets.get(spec["asset"]) or "",
                "duration_minutes": spec["duration_minutes"],
                "order": order,
            },
        )

    def _create_assignment(self, module, course, assignment_def, teacher, module_order):
        Assignment.objects.get_or_create(
            module=module,
            title=assignment_def["title"],
            defaults={
                "course": course,
                "description": assignment_def["description"],
                "due_date": timezone.now() + timedelta(days=14 * module_order),
                "total_marks": 100,
                "status": Status.PUBLISHED,
                "grading_mode": Assignment.GradingMode.MANUAL,
                "allow_resubmission": True,
                "order": get_next_order(Assignment.objects.filter(module=module)),
                "created_by": teacher,
            },
        )

    def _create_quiz(self, module, course, module_title, questions):
        quiz, _ = Quiz.objects.get_or_create(
            module=module,
            title=f"{module_title} — Quiz",
            defaults={
                "course": course,
                "description": f"10-question assessment covering {module_title}.",
                "passing_score": 70,
                "time_limit_minutes": 20,
                "attempts_allowed": 3,
                "status": Status.PUBLISHED,
                "order": get_next_order(Quiz.objects.filter(module=module)),
            },
        )
        for order, (text, options, correct_index) in enumerate(questions, start=1):
            question, _ = QuizQuestion.objects.get_or_create(
                quiz=quiz,
                text=text,
                defaults={
                    "question_type": QuizQuestion.QuestionType.MCQ,
                    "marks": 1,
                    "order": order,
                },
            )
            # Every COURSE_DEFS question authors its correct option at index 0, and
            # Choice has no Meta.ordering — so inserting them as written would put
            # the right answer first in every single question, making the seeded
            # quizzes answerable without reading them. Rotating by the question's
            # order spreads the correct answer across all four positions and stays
            # deterministic, so re-seeding reproduces the same quizzes.
            correct_text = options[correct_index]
            rotation = order % len(options)
            for option_text in options[rotation:] + options[:rotation]:
                Choice.objects.get_or_create(
                    question=question,
                    text=option_text,
                    defaults={"is_correct": option_text == correct_text},
                )
        return quiz

    def _seed_pathways(self, courses_by_code):
        pathways_by_key = {}
        for pathway_def in PATHWAY_DEFS:
            pathway, _ = Pathway.objects.update_or_create(
                name=pathway_def["name"],
                defaults={
                    "summary": pathway_def["summary"],
                    "description": pathway_def["description"],
                    "status": Status.PUBLISHED,
                    "base_price": pathway_def["base_price"],
                },
            )
            pathways_by_key[pathway_def["key"]] = pathway
            for order, code in enumerate(pathway_def["course_codes"], start=1):
                course = courses_by_code.get(code)
                if not course:
                    continue
                PathwayCourse.objects.get_or_create(
                    pathway=pathway, course=course, defaults={"order": order}
                )
        return pathways_by_key

    def _create_tiers(self, categories, pathways_by_key):
        tiers = []
        for tier_def in TIER_DEFS:
            tier, _ = Tier.objects.update_or_create(
                level=tier_def["level"],
                defaults={
                    "name": tier_def["name"],
                    "audience": tier_def["audience"],
                    "focus_description": tier_def["focus_description"],
                    "status": Status.PUBLISHED,
                    "category": categories[tier_def["category"]],
                    "estimated_duration": tier_def["estimated_duration"],
                },
            )
            tiers.append(tier)

            # `order` restarts at 1 for each tier — the uniqueness constraint is
            # per-tier (unique_tierpathway_order_per_tier), not global.
            for order, pathway_key in enumerate(tier_def["pathway_keys"], start=1):
                TierPathway.objects.update_or_create(
                    tier=tier, pathway=pathways_by_key[pathway_key], defaults={"order": order}
                )
        return tiers

    def _seed_bundle_rules(self):
        for rule in BUNDLE_RULES:
            PathwayBundleRule.objects.update_or_create(
                pathway_count=rule["pathway_count"],
                defaults={"discount_percent": rule["discount_percent"]},
            )

    def _seed_questionnaire(self, pathways_by_key):
        for order, question_def in enumerate(QUESTIONNAIRE, start=1):
            question, _ = OnboardingQuestion.objects.get_or_create(
                text=question_def["text"], defaults={"order": order}
            )
            for index, option_def in enumerate(question_def["options"], start=1):
                option = QuestionOption.objects.create(
                    question=question, text=option_def["text"], order=index
                )
                for pathway_key, weight in option_def["weights"].items():
                    QuestionOptionPathwayWeight.objects.create(
                        option=option, pathway=pathways_by_key[pathway_key], weight=weight
                    )

    def _seed_drills(self):
        for drill_def in DRILL_DEFS:
            question, _ = DrillQuestion.objects.get_or_create(
                scenario=drill_def["scenario"],
                defaults={"guidelines": drill_def["guidelines"], "status": Status.PUBLISHED},
            )
            for option_def in drill_def["options"]:
                DrillOption.objects.update_or_create(
                    question=question,
                    key=option_def["key"],
                    defaults={
                        "text": option_def["text"],
                        "impact": option_def["impact"],
                        "rationale": option_def["rationale"],
                        "score": option_def["score"],
                    },
                )
