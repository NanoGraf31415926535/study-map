from django.urls import path
from .views import (
    GenerateFlashcardsView, GenerateQuizView, SubmitQuizView,
    FlashcardSM2View, EnhanceNoteView, export_quiz, export_flashcards,
    FlashcardDeckListView, QuizListView, QuizDetailView
)

app_name = 'generation'

urlpatterns = [
    path('projects/<int:project_id>/generate/flashcards/', GenerateFlashcardsView.as_view(), name='generate-flashcards'),
    path('projects/<int:project_id>/flashcard-decks/', FlashcardDeckListView.as_view(), name='flashcard-decks'),
    path('projects/<int:project_id>/generate/quiz/', GenerateQuizView.as_view(), name='generate-quiz'),
    path('projects/<int:project_id>/quizzes/', QuizListView.as_view(), name='quizzes'),
    path('projects/<int:project_id>/quizzes/<int:quiz_id>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('projects/<int:project_id>/quiz/<int:quiz_id>/submit/', SubmitQuizView.as_view(), name='submit-quiz'),
    path('flashcards/<int:card_id>/review/', FlashcardSM2View.as_view(), name='flashcard-review'),
    path('projects/<int:project_id>/notes/<int:note_id>/ai-enhance/', EnhanceNoteView.as_view(), name='enhance-note'),
    path('projects/<int:project_id>/quiz/<int:quiz_id>/export/', export_quiz, name='export-quiz'),
    path('projects/<int:project_id>/flashcards/<int:deck_id>/export/', export_flashcards, name='export-flashcards'),
]