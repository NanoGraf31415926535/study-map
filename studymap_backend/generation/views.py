import json
from datetime import date, timedelta
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from projects.models import Project, Flashcard, FlashcardDeck, Quiz, QuizQuestion
from .services import GenerationService


service = GenerationService()


# ---------------------------------------------------------------------------
# Unicode sanitiser — strips/replaces characters Helvetica cannot render
# ---------------------------------------------------------------------------

def safe_text(text, max_len=None):
    """
    Replace Unicode characters outside the Latin-1 / Helvetica glyph set so
    ReportLab never receives a codepoint it cannot encode.
    """
    if text is None:
        return ''
    text = str(text)
    replacements = {
        # Spaces
        '\u202f': ' ', '\u00a0': ' ', '\u2009': ' ', '\u2003': ' ', '\u2002': ' ',
        # Quotes
        '\u2019': "'", '\u2018': "'", '\u201c': '"', '\u201d': '"',
        '\u201e': '"', '\u2032': "'", '\u2033': '"',
        # Dashes / hyphens
        '\u2014': '--', '\u2013': '-', '\u2012': '-', '\u2010': '-',
        '\u2011': '-', '\u25a0': '-', '\u25a1': '-', '\u2022': '*',
        # Math & symbols
        '\u00d7': 'x',  '\u00f7': '/',  '\u2248': '~',  '\u2260': '!=',
        '\u2264': '<=', '\u2265': '>=', '\u221e': 'inf', '\u00b1': '+/-',
        '\u00b2': '2',  '\u00b3': '3',  '\u00b0': 'deg', '\u03c0': 'pi',
        '\u03b1': 'alpha', '\u03b2': 'beta', '\u03b3': 'gamma',
        '\u03b4': 'delta', '\u03bc': 'u', '\u2126': 'Ohm',
        # Fractions
        '\u00bd': '1/2', '\u00bc': '1/4', '\u00be': '3/4',
        # Ellipsis & misc
        '\u2026': '...', '\u2020': '+', '\u2021': '++',
        # Accented Latin -> ASCII
        '\u00e0': 'a', '\u00e1': 'a', '\u00e2': 'a', '\u00e3': 'a',
        '\u00e4': 'a', '\u00e5': 'a', '\u00e6': 'ae', '\u00e7': 'c',
        '\u00e8': 'e', '\u00e9': 'e', '\u00ea': 'e', '\u00eb': 'e',
        '\u00ec': 'i', '\u00ed': 'i', '\u00ee': 'i', '\u00ef': 'i',
        '\u00f0': 'd', '\u00f1': 'n',
        '\u00f2': 'o', '\u00f3': 'o', '\u00f4': 'o', '\u00f5': 'o',
        '\u00f6': 'o', '\u00f8': 'o',
        '\u00f9': 'u', '\u00fa': 'u', '\u00fb': 'u', '\u00fc': 'u',
        '\u00fd': 'y', '\u00ff': 'y',
        '\u00c0': 'A', '\u00c1': 'A', '\u00c2': 'A', '\u00c3': 'A',
        '\u00c4': 'A', '\u00c5': 'A', '\u00c6': 'AE', '\u00c7': 'C',
        '\u00c8': 'E', '\u00c9': 'E', '\u00ca': 'E', '\u00cb': 'E',
        '\u00cc': 'I', '\u00cd': 'I', '\u00ce': 'I', '\u00cf': 'I',
        '\u00d0': 'D', '\u00d1': 'N',
        '\u00d2': 'O', '\u00d3': 'O', '\u00d4': 'O', '\u00d5': 'O',
        '\u00d6': 'O', '\u00d8': 'O',
        '\u00d9': 'U', '\u00da': 'U', '\u00db': 'U', '\u00dc': 'U',
        '\u00dd': 'Y', '\u00df': 'ss',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Nuclear fallback: drop anything still outside ASCII
    text = text.encode('ascii', errors='replace').decode('ascii').replace('?', '')

    if max_len and len(text) > max_len:
        text = text[:max_len - 3] + '...'
    return text


# ---------------------------------------------------------------------------
# Shared PDF style helpers
# ---------------------------------------------------------------------------

def _build_pdf_styles():
    """Return a dict of named ParagraphStyles and colour constants for our PDFs."""
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT, TA_CENTER

    NAVY      = colors.HexColor('#1E3A5F')
    TEAL      = colors.HexColor('#2A9D8F')
    LIGHT     = colors.HexColor('#F0F4F8')
    MUTED     = colors.HexColor('#6B7A8D')
    WHITE     = colors.white
    DARK      = colors.HexColor('#1A1A2E')
    OPTION_BG = colors.HexColor('#F8FAFC')

    base = getSampleStyleSheet()

    return {
        # Colour constants
        'NAVY': NAVY, 'TEAL': TEAL, 'LIGHT': LIGHT,
        'MUTED': MUTED, 'WHITE': WHITE, 'DARK': DARK,
        'OPTION_BG': OPTION_BG,

        # Paragraph styles
        'doc_title': ParagraphStyle(
            'doc_title', parent=base['Title'],
            fontName='Helvetica-Bold', fontSize=22,
            textColor=WHITE, alignment=TA_CENTER, spaceAfter=4,
        ),
        'doc_subtitle': ParagraphStyle(
            'doc_subtitle', parent=base['Normal'],
            fontName='Helvetica', fontSize=10,
            textColor=colors.HexColor('#B0C4DE'), alignment=TA_CENTER,
        ),
        'card_number': ParagraphStyle(
            'card_number', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=8,
            textColor=TEAL, spaceAfter=2,
        ),
        'card_label': ParagraphStyle(
            'card_label', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=7,
            textColor=MUTED, spaceAfter=2, leading=10,
        ),
        'card_front': ParagraphStyle(
            'card_front', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=11,
            textColor=DARK, spaceAfter=6, leading=15,
        ),
        'card_back': ParagraphStyle(
            'card_back', parent=base['Normal'],
            fontName='Helvetica', fontSize=10,
            textColor=colors.HexColor('#2D3748'), spaceAfter=0, leading=14,
        ),
        'q_number': ParagraphStyle(
            'q_number', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=8,
            textColor=TEAL, spaceAfter=3,
        ),
        'q_text': ParagraphStyle(
            'q_text', parent=base['Normal'],
            fontName='Helvetica-Bold', fontSize=11,
            textColor=DARK, spaceAfter=8, leading=15,
        ),
        'option': ParagraphStyle(
            'option', parent=base['Normal'],
            fontName='Helvetica', fontSize=10,
            textColor=colors.HexColor('#2D3748'), spaceAfter=3, leading=14, leftIndent=4,
        ),
        'answer_key_title': ParagraphStyle(
            'answer_key_title', parent=base['Heading1'],
            fontName='Helvetica-Bold', fontSize=16,
            textColor=NAVY, spaceAfter=16,
        ),
        'answer_item': ParagraphStyle(
            'answer_item', parent=base['Normal'],
            fontName='Helvetica', fontSize=10,
            textColor=DARK, leading=14,
        ),
        'bloom_badge': ParagraphStyle(
            'bloom_badge', parent=base['Normal'],
            fontName='Helvetica', fontSize=7, textColor=MUTED,
        ),
    }


def _draw_header_banner(canvas_obj, doc, title_text, subtitle_text, styles):
    """Coloured header banner drawn directly on the canvas (first page)."""
    from reportlab.lib.pagesizes import letter
    width, height = letter

    canvas_obj.setFillColor(styles['NAVY'])
    canvas_obj.rect(0, height - 90, width, 90, fill=1, stroke=0)

    canvas_obj.setFillColor(styles['TEAL'])
    canvas_obj.rect(0, height - 94, width, 4, fill=1, stroke=0)

    canvas_obj.setFont('Helvetica-Bold', 22)
    canvas_obj.setFillColor(styles['WHITE'])
    canvas_obj.drawCentredString(width / 2, height - 52, safe_text(title_text, 80))

    canvas_obj.setFont('Helvetica', 10)
    canvas_obj.setFillColor(styles['doc_subtitle'].textColor)
    canvas_obj.drawCentredString(width / 2, height - 72, safe_text(subtitle_text))


def _draw_page_footer(canvas_obj, doc):
    """Thin teal stripe + right-aligned page number."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    width, _ = letter

    canvas_obj.setFillColor(colors.HexColor('#2A9D8F'))
    canvas_obj.rect(0, 28, width, 2, fill=1, stroke=0)
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.setFillColor(colors.HexColor('#6B7A8D'))
    canvas_obj.drawRightString(width - 40, 14, f"Page {doc.page}")


def _accent_card(block_contents, accent_color, styles):
    """
    Wrap a list of flowables in a white card with a coloured left-accent stripe.
    Returns a single KeepTogether flowable.
    """
    from reportlab.platypus import Table, TableStyle, KeepTogether
    from reportlab.lib import colors

    card_inner = Table([[block_contents]], colWidths=[510])
    card_inner.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), styles['WHITE']),
        ('LEFTPADDING',   (0, 0), (-1, -1), 14),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 14),
        ('TOPPADDING',    (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BOX',           (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E0')),
    ]))

    accent = Table([['']], colWidths=[5])
    accent.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), accent_color),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    outer = Table([[accent, card_inner]], colWidths=[5, 510])
    outer.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    return KeepTogether(outer)


# ---------------------------------------------------------------------------
# Django views (unchanged business logic)
# ---------------------------------------------------------------------------

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
                'id': q.id, 'order': q.order,
                'question_text': q.question_text,
                'option_a': q.option_a, 'option_b': q.option_b,
                'option_c': q.option_c, 'option_d': q.option_d,
                'bloom_level': q.bloom_level,
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
                'option_a': q.option_a, 'option_b': q.option_b,
                'option_c': q.option_c, 'option_d': q.option_d,
                'user_answer': q.user_answer,
                'correct_option': q.correct_option,
                'explanation': q.explanation,
                'bloom_level': q.bloom_level,
                'is_correct': q.user_answer == q.correct_option,
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
            'next_review': card.next_review,
        })


class EnhanceNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id, note_id):
        from projects.models import Note
        note = get_object_or_404(Note, id=note_id, project_id=project_id, project__owner=request.user)
        enhanced = service.enhance_note(note.content)
        return Response({'original': note.content, 'enhanced': enhanced})


# ---------------------------------------------------------------------------
# Quiz export
# ---------------------------------------------------------------------------

def export_quiz(request, project_id, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id, project_id=project_id)
    export_format = request.GET.get('format', 'json')

    if export_format == 'md':
        md = f"# {quiz.title}\n\n"
        for q in quiz.questions.all():
            md += f"## Question {q.order + 1}\n{q.question_text}\n\n"
            md += f"A. {q.option_a}\nB. {q.option_b}\nC. {q.option_c}\nD. {q.option_d}\n\n"
            md += f"**Answer: {q.correct_option.upper()}**\n\n_{q.explanation}_\n\n---\n\n"
        response = HttpResponse(md, content_type='text/markdown')
        response['Content-Disposition'] = f'attachment; filename="{quiz.title}.md"'
        return response

    elif export_format == 'pdf':
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import (
                SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                KeepTogether, HRFlowable,
            )
            from reportlab.lib import colors
            from io import BytesIO

            S = _build_pdf_styles()
            NAVY, TEAL, LIGHT, WHITE, DARK, MUTED, OPTION_BG = (
                S['NAVY'], S['TEAL'], S['LIGHT'], S['WHITE'],
                S['DARK'], S['MUTED'], S['OPTION_BG'],
            )

            BLOOM_COLORS = {
                'remember':   colors.HexColor('#68D391'),
                'understand': colors.HexColor('#63B3ED'),
                'apply':      colors.HexColor('#F6AD55'),
                'analyze':    colors.HexColor('#FC8181'),
                'evaluate':   colors.HexColor('#B794F4'),
                'create':     colors.HexColor('#F687B3'),
            }

            pdf_buffer = BytesIO()

            def on_first_page(cv, doc):
                cv.saveState()
                _draw_header_banner(
                    cv, doc, quiz.title,
                    f"{quiz.question_count} questions  |  Generated {date.today()}",
                    S,
                )
                _draw_page_footer(cv, doc)
                cv.restoreState()

            def on_later_pages(cv, doc):
                cv.saveState()
                _draw_page_footer(cv, doc)
                cv.restoreState()

            doc = SimpleDocTemplate(
                pdf_buffer, pagesize=letter,
                leftMargin=40, rightMargin=40,
                topMargin=110, bottomMargin=50,
            )

            story = [Spacer(1, 8)]

            for q in quiz.questions.all():
                bloom      = safe_text(q.bloom_level or 'understand').lower()
                bloom_color = BLOOM_COLORS.get(bloom, TEAL)

                block = []

                # Number + bloom badge row
                header_tbl = Table(
                    [[Paragraph(f"Question {q.order + 1}", S['q_number']),
                      Paragraph(bloom.upper(), S['bloom_badge'])]],
                    colWidths=[380, 130],
                )
                header_tbl.setStyle(TableStyle([
                    ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
                    ('ALIGN',         (1, 0), (1,  0),  'RIGHT'),
                    ('LEFTPADDING',   (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
                    ('TOPPADDING',    (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                    ('TEXTCOLOR',     (1, 0), (1,  0),  bloom_color),
                    ('FONTNAME',      (1, 0), (1,  0),  'Helvetica-Bold'),
                    ('FONTSIZE',      (1, 0), (1,  0),  8),
                ]))
                block.append(header_tbl)
                block.append(Spacer(1, 4))

                # Question text — fully wrapped by Paragraph
                block.append(Paragraph(safe_text(q.question_text), S['q_text']))

                # Options
                for opt_text, label in [
                    (q.option_a, 'A'), (q.option_b, 'B'),
                    (q.option_c, 'C'), (q.option_d, 'D'),
                ]:
                    opt_tbl = Table(
                        [[Paragraph(f"<b>{label}</b>", S['option']),
                          Paragraph(safe_text(opt_text), S['option'])]],
                        colWidths=[22, 488],
                    )
                    opt_tbl.setStyle(TableStyle([
                        ('BACKGROUND',    (0, 0), (-1, -1), OPTION_BG),
                        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
                        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
                        ('TOPPADDING',    (0, 0), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
                        ('TEXTCOLOR',     (0, 0), (0,  0),  TEAL),
                    ]))
                    block.append(opt_tbl)
                    block.append(Spacer(1, 3))

                story.append(_accent_card(block, bloom_color, S))
                story.append(Spacer(1, 12))

            # Answer key
            story.append(HRFlowable(width='100%', thickness=1.5, color=TEAL, spaceAfter=16))
            story.append(Paragraph("Answer Key", S['answer_key_title']))

            key_rows, row = [], []
            for q in quiz.questions.all():
                teal_hex = '2A9D8F'
                cell = Paragraph(
                    f"<b>Q{q.order + 1}.</b>  "
                    f"<font color='#{teal_hex}'>{q.correct_option.upper()}</font>",
                    S['answer_item'],
                )
                row.append(cell)
                if len(row) == 5:
                    key_rows.append(row)
                    row = []
            if row:
                row += [Paragraph('', S['answer_item'])] * (5 - len(row))
                key_rows.append(row)

            key_tbl = Table(key_rows, colWidths=[102] * 5)
            key_tbl.setStyle(TableStyle([
                ('BACKGROUND',     (0, 0), (-1, -1), LIGHT),
                ('LEFTPADDING',    (0, 0), (-1, -1), 10),
                ('RIGHTPADDING',   (0, 0), (-1, -1), 10),
                ('TOPPADDING',     (0, 0), (-1, -1), 7),
                ('BOTTOMPADDING',  (0, 0), (-1, -1), 7),
                ('GRID',           (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E0')),
                ('ROWBACKGROUNDS', (0, 0), (-1, -1), [WHITE, LIGHT]),
            ]))
            story.append(key_tbl)

            doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)

            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{safe_text(quiz.title, 60)}.pdf"'
            return response

        except Exception as e:
            import logging
            logging.error(f"Quiz PDF export error: {e}", exc_info=True)
            return HttpResponse(f'PDF export failed: {str(e)}', status=500, content_type='text/plain')

    elif export_format == 'anki':
        rows = ['Question,Option A,Option B,Option C,Option D,Correct,Explanation']
        for q in quiz.questions.all():
            def esc(s): return s.replace('"', '""')
            rows.append(
                f'"{esc(q.question_text)}","{esc(q.option_a)}","{esc(q.option_b)}",'
                f'"{esc(q.option_c)}","{esc(q.option_d)}","{q.correct_option}","{esc(q.explanation)}"'
            )
        response = HttpResponse('\n'.join(rows), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{quiz.title}.csv"'
        return response

    else:
        return HttpResponse('Invalid format. Use md, pdf, or anki', status=400)


# ---------------------------------------------------------------------------
# CRUD list / detail views
# ---------------------------------------------------------------------------

class FlashcardDeckListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        decks = FlashcardDeck.objects.filter(project=project)
        return Response([{
            'id': deck.id, 'title': deck.title,
            'card_count': deck.card_count, 'generated_at': deck.generated_at,
            'cards': [{'id': c.id, 'front': c.front, 'back': c.back,
                       'difficulty': c.difficulty, 'next_review': c.next_review}
                      for c in deck.cards.all()]
        } for deck in decks])


class QuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        quizzes = Quiz.objects.filter(project=project)
        return Response([{
            'id': quiz.id, 'title': quiz.title,
            'question_count': quiz.question_count, 'score': quiz.score,
            'completed_at': quiz.completed_at, 'created_at': quiz.created_at,
        } for quiz in quizzes])


class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id, project_id=project_id, project__owner=request.user)
        return Response({
            'id': quiz.id, 'title': quiz.title,
            'question_count': quiz.question_count, 'score': quiz.score,
            'completed_at': quiz.completed_at, 'created_at': quiz.created_at,
            'questions': [{
                'id': q.id, 'order': q.order,
                'question_text': q.question_text,
                'option_a': q.option_a, 'option_b': q.option_b,
                'option_c': q.option_c, 'option_d': q.option_d,
                'bloom_level': q.bloom_level, 'user_answer': q.user_answer,
            } for q in quiz.questions.all()]
        })


# ---------------------------------------------------------------------------
# Flashcard export
# ---------------------------------------------------------------------------

def export_flashcards(request, project_id, deck_id):
    try:
        deck = FlashcardDeck.objects.get(id=deck_id)
    except FlashcardDeck.DoesNotExist:
        return HttpResponse('Deck not found', status=404)

    export_format = request.GET.get('format', 'csv')

    if export_format == 'csv':
        rows = ['Front,Back']
        for card in deck.cards.all():
            front = card.front.replace('"', '""').replace('\n', ' ')
            back  = card.back.replace('"', '""').replace('\n', ' ')
            rows.append(f'"{front}","{back}"')
        response = HttpResponse('\n'.join(rows), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{deck.title}.csv"'
        return response

    elif export_format == 'anki':
        rows = []
        for card in deck.cards.all():
            front = card.front.replace(';', ',').replace('\n', ' ')
            back  = card.back.replace(';', ',').replace('\n', ' ')
            rows.append(f'{front};{back}')
        response = HttpResponse('\n'.join(rows), content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = f'attachment; filename="{deck.title}_anki.csv"'
        return response

    elif export_format == 'md':
        md = f"# {deck.title}\n\n"
        for i, card in enumerate(deck.cards.all(), 1):
            md += f"## Card {i}\n\n### Front\n{card.front}\n\n### Back\n{card.back}\n\n---\n\n"
        response = HttpResponse(md, content_type='text/markdown; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{deck.title}.md"'
        return response

    elif export_format == 'pdf':
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import (
                SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                KeepTogether, HRFlowable,
            )
            from reportlab.lib import colors
            from io import BytesIO

            S = _build_pdf_styles()
            TEAL, WHITE, DARK = S['TEAL'], S['WHITE'], S['DARK']

            DIFF_COLORS = {
                'easy':   colors.HexColor('#68D391'),
                'medium': colors.HexColor('#63B3ED'),
                'hard':   colors.HexColor('#FC8181'),
            }

            pdf_buffer = BytesIO()

            def on_first_page(cv, doc):
                cv.saveState()
                _draw_header_banner(
                    cv, doc, deck.title,
                    f"{deck.card_count} flashcards  |  Generated {deck.generated_at.strftime('%Y-%m-%d')}",
                    S,
                )
                _draw_page_footer(cv, doc)
                cv.restoreState()

            def on_later_pages(cv, doc):
                cv.saveState()
                _draw_page_footer(cv, doc)
                cv.restoreState()

            doc = SimpleDocTemplate(
                pdf_buffer, pagesize=letter,
                leftMargin=40, rightMargin=40,
                topMargin=110, bottomMargin=50,
            )

            story = [Spacer(1, 8)]

            for i, card in enumerate(deck.cards.all(), 1):
                difficulty  = (card.difficulty or 'medium').lower()
                diff_color  = DIFF_COLORS.get(difficulty, TEAL)

                block = []

                # Card number + difficulty badge
                header_tbl = Table(
                    [[Paragraph(f"Card {i}", S['card_number']),
                      Paragraph(difficulty.upper(), S['bloom_badge'])]],
                    colWidths=[380, 130],
                )
                header_tbl.setStyle(TableStyle([
                    ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
                    ('ALIGN',         (1, 0), (1,  0),  'RIGHT'),
                    ('LEFTPADDING',   (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
                    ('TOPPADDING',    (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                    ('TEXTCOLOR',     (1, 0), (1,  0),  diff_color),
                    ('FONTNAME',      (1, 0), (1,  0),  'Helvetica-Bold'),
                    ('FONTSIZE',      (1, 0), (1,  0),  8),
                ]))
                block.append(header_tbl)
                block.append(Spacer(1, 6))

                # FRONT — fully wrapped
                block.append(Paragraph("FRONT", S['card_label']))
                block.append(Paragraph(safe_text(card.front), S['card_front']))

                # Divider
                block.append(HRFlowable(
                    width='100%', thickness=0.75,
                    color=colors.HexColor('#CBD5E0'), spaceAfter=8,
                ))

                # BACK — fully wrapped, NO truncation
                block.append(Paragraph("BACK", S['card_label']))
                block.append(Paragraph(safe_text(card.back), S['card_back']))

                story.append(_accent_card(block, diff_color, S))
                story.append(Spacer(1, 12))

            doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)

            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{safe_text(deck.title, 60)}.pdf"'
            return response

        except Exception as e:
            import logging
            logging.error(f"Flashcard PDF export error: {e}", exc_info=True)
            return HttpResponse(f'PDF export failed: {str(e)}', status=500, content_type='text/plain')

    else:
        return HttpResponse('Invalid format. Use csv, anki, md, or pdf', status=400)