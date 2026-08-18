from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from assignments.models import Assignment
from common.models import Status
from common.ordering import get_next_order
from courses.models import Category, Course, CourseInstructor, Tag
from lessons.models import Lesson
from modules.models import Module
from onboarding.models import Question as OnboardingQuestion
from onboarding.models import QuestionOption, QuestionOptionPathwayWeight
from pathways.models import Pathway, PathwayBundleRule, PathwayCourse
from quizzes.models import Choice
from quizzes.models import Question as QuizQuestion
from quizzes.models import Quiz

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

YOUTUBE_DEMO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Every module gets exactly these three lesson types, in this order, per the
# "PDF, Video, DOC/DOCX in every module" requirement.
LESSON_TYPE_CYCLE = [Lesson.ContentType.VIDEO, Lesson.ContentType.PDF, Lesson.ContentType.DOCUMENT]

LESSON_TYPE_LABELS = {
    Lesson.ContentType.VIDEO: "Video Walkthrough",
    Lesson.ContentType.PDF: "Reading (PDF)",
    Lesson.ContentType.DOCUMENT: "Reference Guide (DOCX)",
}

LESSON_TYPE_CONTENT = {
    Lesson.ContentType.VIDEO: {
        "video_url": YOUTUBE_DEMO_URL,
        "content_data": "",
        "duration_minutes": 12,
    },
    Lesson.ContentType.PDF: {
        "video_url": None,
        "content_data": "Downloadable PDF reference material covering this module's topic in depth.",
        "duration_minutes": None,
    },
    Lesson.ContentType.DOCUMENT: {
        "video_url": None,
        "content_data": "Supplementary DOCX handout with worked examples and practice notes.",
        "duration_minutes": None,
    },
}

# Each module's `questions` list holds exactly 10 (text, [4 options], correct_index)
# MCQ tuples, per the "10 MCQs, 4 options, one correct answer" requirement.
COURSE_DEFS = [
    {
        "code": "PYTHON101",
        "title": "Python Programming Fundamentals",
        "category": "Technology",
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
        "category": "Technology",
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
        "category": "Mathematics",
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
        "category": "Humanities",
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
        "category": "Science",
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
        "category": "Business",
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
        "category": "Communication",
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
        "category": "Athletics",
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
        "category": "Athletics",
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
]

BUNDLE_RULES = [
    {"pathway_count": 2, "discount_percent": 15},
    {"pathway_count": 3, "discount_percent": 25},
    {"pathway_count": 4, "discount_percent": 30},
    {"pathway_count": 5, "discount_percent": 35},
]

# Onboarding questionnaire used to recommend a pathway. Each option's "weights"
# dict maps a PATHWAY_DEFS "key" -> weight toward that pathway.
QUESTIONNAIRE = [
    {
        "text": "What best describes your current situation?",
        "options": [
            {"text": "I'm a parent supporting my child's homeschool education", "weights": {"parent_homeschool": 3}},
            {"text": "I'm a student focused on traditional academic coursework", "weights": {"education_academic": 3}},
            {"text": "I'm aiming for Ivy League or other highly selective admissions", "weights": {"ivy_league": 3}},
            {"text": "I'm a competitive student-athlete balancing sports and school", "weights": {"athlete_sports": 3}},
            {"text": "I'm interested in business, entrepreneurship, or finance", "weights": {"business": 3}},
            {"text": "I'm an international student preparing to study abroad", "weights": {"international_student": 3}},
        ],
    },
    {
        "text": "What age range are you focused on?",
        "options": [
            {"text": "Elementary / homeschool age", "weights": {"parent_homeschool": 2}},
            {"text": "Middle school", "weights": {"education_academic": 1}},
            {"text": "High school", "weights": {"education_academic": 1, "ivy_league": 1, "athlete_sports": 1}},
            {"text": "College and beyond", "weights": {"business": 1, "international_student": 1}},
        ],
    },
    {
        "text": "How much time can you commit each week?",
        "options": [
            {"text": "1-2 hours", "weights": {"parent_homeschool": 1}},
            {"text": "3-5 hours", "weights": {"education_academic": 1, "athlete_sports": 1}},
            {"text": "5+ hours", "weights": {"ivy_league": 2, "business": 1}},
        ],
    },
    {
        "text": "What's your top academic goal right now?",
        "options": [
            {"text": "Getting into a top-tier or Ivy League university", "weights": {"ivy_league": 3}},
            {"text": "Balancing athletics with strong academics", "weights": {"athlete_sports": 3}},
            {"text": "Building practical business or entrepreneurial skills", "weights": {"business": 3}},
            {"text": "Preparing for studying in another country", "weights": {"international_student": 3}},
            {"text": "Staying on track with core school subjects", "weights": {"education_academic": 2}},
        ],
    },
    {
        "text": "Are you currently playing a competitive sport?",
        "options": [
            {"text": "Yes, at a competitive or travel level", "weights": {"athlete_sports": 3}},
            {"text": "Yes, recreationally", "weights": {"athlete_sports": 1}},
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
            {"text": "Myself, to build career or business skills", "weights": {"business": 2}},
        ],
    },
    {
        "text": "What matters most to you in a curriculum?",
        "options": [
            {"text": "Structured, standards-aligned academics", "weights": {"education_academic": 2}},
            {"text": "A competitive edge for elite admissions", "weights": {"ivy_league": 2}},
            {"text": "Flexibility around a sports schedule", "weights": {"athlete_sports": 2}},
            {"text": "Real-world business and financial literacy", "weights": {"business": 2}},
            {"text": "Support for a global or cross-border education path", "weights": {"international_student": 2}},
            {"text": "Simplicity and guidance for homeschool parents", "weights": {"parent_homeschool": 2}},
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Wipes ALL existing teachers, students, courses, modules, lessons, assignments, "
        "quizzes, enrollments, pathways, and onboarding questions, then reseeds a complete, "
        "realistic demo dataset. The admin account is preserved (get_or_create, never "
        "deleted) rather than reset. Student-course enrollments are intentionally NOT "
        "seeded — enroll students manually (e.g. via the admin portal) after seeding. "
        "Safe to re-run — every run produces the same dataset. Pass --noinput to skip the "
        "confirmation prompt (e.g. for CI/deploy scripts)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--noinput",
            action="store_true",
            help="Skip the confirmation prompt and seed immediately.",
        )

    def handle(self, *args, **options):
        if not options["noinput"]:
            confirm = input(
                "This will DELETE all existing teachers, students, courses, modules, lessons, "
                "assignments, quizzes, enrollments, pathways, and onboarding questions (the "
                "admin account is preserved) and reseed fresh demo data. Students will NOT "
                "be auto-enrolled in any course.\n"
                "Type 'yes' to continue: "
            )
            if confirm.strip().lower() != "yes":
                self.stdout.write(self.style.WARNING("Aborted — no changes were made."))
                return

        with transaction.atomic():
            self._reset_data()
            self.stdout.write(self.style.WARNING("Cleared existing seed data (admin preserved)"))

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

            teachers_by_code = {
                course_def["code"]: teachers[i] for i, course_def in enumerate(COURSE_DEFS)
            }

            categories = self._create_categories()
            courses_by_code = self._create_course_content(categories, teachers_by_code)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created {len(courses_by_code)} courses with modules, lessons, "
                    "assignments, and quizzes"
                )
            )

            pathways_by_key = self._seed_pathways(courses_by_code)
            self.stdout.write(self.style.SUCCESS(f"Created {len(pathways_by_key)} pathways"))

            self._seed_bundle_rules()
            self.stdout.write(self.style.SUCCESS(f"Ensured {len(BUNDLE_RULES)} bundle pricing rule(s)"))

            self._seed_questionnaire(pathways_by_key)
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(QUESTIONNAIRE)} onboarding questions"))

        self.stdout.write(self.style.SUCCESS("Seed data completed successfully."))

    def _reset_data(self):
        # Deleting teacher/student users cascades their CourseInstructor rows, cart items,
        # enrollments, quiz attempts/answers, assignment submissions, onboarding progress/
        # answers, and pathway enrollments. Deleting courses cascades modules/lessons/
        # assignments/quizzes/questions/choices/pathway_courses. Deleting pathways cascades
        # their pathway_courses and onboarding question-option weights. Category is
        # PROTECTed by Course.category, so it (and Tag) must be cleared after courses. The
        # admin account is intentionally left alone.
        User.objects.filter(role__in=[User.Roles.TEACHER, User.Roles.STUDENT]).delete()
        Course.objects.all().delete()
        Category.objects.all().delete()
        Tag.objects.all().delete()
        Pathway.objects.all().delete()
        OnboardingQuestion.objects.all().delete()

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
        names = sorted({course_def["category"] for course_def in COURSE_DEFS})
        return {name: Category.objects.get_or_create(name=name)[0] for name in names}

    def _create_course_content(self, categories, teachers_by_code):
        courses_by_code = {}
        for course_def in COURSE_DEFS:
            course, _ = Course.objects.get_or_create(
                code=course_def["code"],
                defaults={
                    "title": course_def["title"],
                    "description": course_def["description"],
                    "category": categories[course_def["category"]],
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
                    self._create_lesson(module, module_def["title"], content_type, lesson_order)

                self._create_assignment(module, course, module_def["assignment"], teacher, module_order)
                self._create_quiz(module, course, module_def["title"], module_def["questions"])

        return courses_by_code

    def _create_lesson(self, module, module_title, content_type, order):
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
            for choice_index, option_text in enumerate(options):
                Choice.objects.get_or_create(
                    question=question,
                    text=option_text,
                    defaults={"is_correct": choice_index == correct_index},
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
