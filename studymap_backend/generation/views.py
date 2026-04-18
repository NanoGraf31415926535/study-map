import json
from datetime import date, timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from projects.models import Project, Flashcard, FlashcardDeck, Quiz, QuizQuestion
from .services import GenerationService


service = GenerationService()


class GenerateFlashcardsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        count = request.data.get('count', 15)
        if count not in [15, 30, 50]:
            return Response({'error': 'Count must be 15, 30, or 50'}, status=status.HTTP_400_BAD_REQUEST)

        FlashcardDeck.objects.filter(project=project).delete()
        Flashcard.objects.filter(project=project).delete()

        result = service.generate_flashcards(project_id, count)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        cards = []
        for card_data in result:
            card = Flashcard.objects.create(
                project=project,
                front=card_data.get('front', ''),
                back=card_data.get('back', ''),
                difficulty=card_data.get('difficulty', 'medium')
            )
            cards.append(card)

        deck = FlashcardDeck.objects.create(
            project=project,
            title=f"Flashcards {count} - {date.today()}",
            card_count=len(cards)
        )
        deck.cards.set(cards)

        return Response({
            'id': deck.id,
            'title': deck.title,
            'card_count': deck.card_count,
            'generated_at': deck.generated_at,
            'cards': [{'id': c.id, 'front': c.front, 'back': c.back, 'difficulty': c.difficulty} for c in cards]
        })


class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        count = request.data.get('count', 15)
        if count not in [15, 30, 50]:
            return Response({'error': 'Count must be 15, 30, or 50'}, status=status.HTTP_400_BAD_REQUEST)

        Quiz.objects.filter(project=project).delete()

        result = service.generate_quiz(project_id, count)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        quiz = Quiz.objects.create(
            project=project,
            title=f"Quiz {count} - {date.today()}",
            question_count=count
        )

        questions = []
        for i, q_data in enumerate(result):
            question = QuizQuestion.objects.create(
                quiz=quiz,
                question_text=q_data.get('question_text', ''),
                option_a=q_data.get('option_a', ''),
                option_b=q_data.get('option_b', ''),
                option_c=q_data.get('option_c', ''),
                option_d=q_data.get('option_d', ''),
                correct_option=q_data.get('correct_option', 'a'),
                explanation=q_data.get('explanation', ''),
                bloom_level=q_data.get('bloom_level', 'understand'),
                order=i
            )
            questions.append(question)

        return Response({
            'id': quiz.id,
            'title': quiz.title,
            'question_count': quiz.question_count,
            'created_at': quiz.created_at,
            'questions': [{
                'id': q.id,
                'order': q.order,
                'question_text': q.question_text,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'bloom_level': q.bloom_level
            } for q in questions]
        })


class SubmitQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id, project_id=project_id, project__owner=request.user)
        answers = request.data.get('answers', {})

        correct_count = 0
        total = quiz.questions.count()

        for question in quiz.questions.all():
            user_answer = answers.get(str(question.id))
            if user_answer:
                question.user_answer = user_answer
                question.save()
                if user_answer == question.correct_option:
                    correct_count += 1

        score = round(correct_count / total * 100) if total > 0 else 0
        quiz.score = score
        quiz.completed_at = timezone.now()
        quiz.save()

        return Response({
            'score': score,
            'correct': correct_count,
            'total': total,
            'questions': [{
                'id': q.id,
                'question_text': q.question_text,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'user_answer': q.user_answer,
                'correct_option': q.correct_option,
                'explanation': q.explanation,
                'bloom_level': q.bloom_level,
                'is_correct': q.user_answer == q.correct_option
            } for q in quiz.questions.all()]
        })


class FlashcardSM2View(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, card_id):
        card = get_object_or_404(Flashcard, id=card_id, project__owner=request.user)
        quality = int(request.data.get('quality', 3))

        if quality < 3:
            card.sm2_repetitions = 0
            card.sm2_interval = 1
        else:
            if card.sm2_repetitions == 0:
                card.sm2_interval = 1
            elif card.sm2_repetitions == 1:
                card.sm2_interval = 6
            else:
                card.sm2_interval = round(card.sm2_interval * card.sm2_easiness)

            card.sm2_easiness = max(1.3, card.sm2_easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            card.sm2_repetitions += 1

        card.next_review = date.today() + timedelta(days=card.sm2_interval)
        card.save()

        return Response({
            'interval': card.sm2_interval,
            'repetitions': card.sm2_repetitions,
            'easiness': card.sm2_easiness,
            'next_review': card.next_review
        })


class EnhanceNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id, note_id):
        from projects.models import Note
        note = get_object_or_404(Note, id=note_id, project_id=project_id, project__owner=request.user)

        enhanced = service.enhance_note(note.content)

        return Response({
            'original': note.content,
            'enhanced': enhanced
        })


class ExportQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, quiz_id):
        from django.http import HttpResponse

        quiz = get_object_or_404(Quiz, id=quiz_id, project_id=project_id, project__owner=request.user)
        export_format = request.query_params.get('format', 'json')

        if export_format == 'anki':
            rows = ['Question,Option A,Option B,Option C,Option D,Correct,Explanation']
            for q in quiz.questions.all():
                q_text = q.question_text.replace('"', '""')
                opt_a = q.option_a.replace('"', '""')
                opt_b = q.option_b.replace('"', '""')
                opt_c = q.option_c.replace('"', '""')
                opt_d = q.option_d.replace('"', '""')
                exp = q.explanation.replace('"', '""')
                rows.append(f'"{q_text}","{opt_a}","{opt_b}","{opt_c}","{opt_d}","{q.correct_option}","{exp}"')
            csv = '\n'.join(rows)
            response = HttpResponse(csv, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{quiz.title}.csv"'
            return response

        elif export_format == 'notion':
            md = f"# {quiz.title}\n\n"
            for q in quiz.questions.all():
                md += f"## {q.order + 1}. {q.question_text}\n\n"
                md += f"- [ ] {q.option_a}\n"
                md += f"- [ ] {q.option_b}\n"
                md += f"- [ ] {q.option_c}\n"
                md += f"- [ ] {q.option_d}\n\n"
                md += f"**Answer: {q.correct_option.upper()}** — {q.explanation}\n\n"
            response = HttpResponse(md, content_type='text/markdown')
            response['Content-Disposition'] = f'attachment; filename="{quiz.title}.md"'
            return response

        elif export_format == 'pdf':
            try:
                from reportlab.lib.pagesizes import letter
                from reportlab.pdfgen import canvas
                from io import BytesIO
                buffer = BytesIO()
                p = canvas.Canvas(buffer, pagesize=letter)
                p.setFont("Helvetica-Bold", 16)
                p.drawString(50, 750, quiz.title)
                p.setFont("Helvetica", 12)
                y = 700
                for q in quiz.questions.all():
                    if y < 100:
                        p.showPage()
                        y = 750
                    p.drawString(50, y, f"{q.order + 1}. {q.question_text[:80]}")
                    y -= 20
                    for opt, label in [(q.option_a, 'A'), (q.option_b, 'B'), (q.option_c, 'C'), (q.option_d, 'D')]:
                        p.drawString(70, y, f"{label}) {opt[:60]}")
                        y -= 15
                    y -= 20
                p.showPage()
                p.save()
                buffer.seek(0)
                response = HttpResponse(buffer.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{quiz.title}.pdf"'
                return response
            except ImportError:
                return Response({'error': 'PDF export requires reportlab'}, status=status.HTTP_501_NOT_IMPLEMENTED)

        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


class FlashcardDeckListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        decks = FlashcardDeck.objects.filter(project=project)
        return Response([{
            'id': deck.id,
            'title': deck.title,
            'card_count': deck.card_count,
            'generated_at': deck.generated_at,
            'cards': [{'id': c.id, 'front': c.front, 'back': c.back, 'difficulty': c.difficulty, 'next_review': c.next_review} for c in deck.cards.all()]
        } for deck in decks])


class QuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        quizzes = Quiz.objects.filter(project=project)
        return Response([{
            'id': quiz.id,
            'title': quiz.title,
            'question_count': quiz.question_count,
            'score': quiz.score,
            'completed_at': quiz.completed_at,
            'created_at': quiz.created_at,
        } for quiz in quizzes])


class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id, project_id=project_id, project__owner=request.user)
        return Response({
            'id': quiz.id,
            'title': quiz.title,
            'question_count': quiz.question_count,
            'score': quiz.score,
            'completed_at': quiz.completed_at,
            'created_at': quiz.created_at,
            'questions': [{
                'id': q.id,
                'order': q.order,
                'question_text': q.question_text,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'bloom_level': q.bloom_level,
                'user_answer': q.user_answer
            } for q in quiz.questions.all()]
        })


class ExportFlashcardsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, deck_id):
        deck = get_object_or_404(FlashcardDeck, id=deck_id, project_id=project_id, project__owner=request.user)
        export_format = request.query_params.get('format', 'csv')

        rows = ['Front,Back']
        for card in deck.cards.all():
            front = card.front.replace('"', '""')
            back = card.back.replace('"', '""')
            rows.append(f'"{front}","{back}"')

        csv = '\n'.join(rows)
        from django.http import HttpResponse
        response = HttpResponse(csv, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{deck.title}.csv"'
        return response