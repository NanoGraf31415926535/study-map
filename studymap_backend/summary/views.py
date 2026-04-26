from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from projects.models import Project
from .services import SummaryService
from .models import Summary
from datetime import date
from generation.views import safe_text


service = SummaryService()


def _build_pdf_styles():
    from reportlab.lib.styles import ParagraphStyle, TA_CENTER, TA_LEFT
    from reportlab.lib.enums import TA_CENTER as TAC
    from reportlab.lib import colors

    NAVY = colors.HexColor('#1E3A5F')
    TEAL = colors.HexColor('#2A9D8F')
    LIGHT = colors.HexColor('#F1F5F9')
    WHITE = colors.HexColor('#FFFFFF')
    DARK = colors.HexColor('#1E293B')
    MUTED = colors.HexColor('#64748B')
    OPTION_BG = colors.HexColor('#F8FAFC')

    styles = {}

    styles['title'] = ParagraphStyle(
        'Title', fontName='Helvetica-Bold', fontSize=22, textColor=NAVY,
        spaceAfter=6,
    )
    styles['subtitle'] = ParagraphStyle(
        'Subtitle', fontName='Helvetica', fontSize=12, textColor=MUTED,
        spaceAfter=20,
    )
    styles['section'] = ParagraphStyle(
        'Section', fontName='Helvetica-Bold', fontSize=14, textColor=NAVY,
        spaceAfter=8,
    )
    styles['body'] = ParagraphStyle(
        'Body', fontName='Helvetica', fontSize=10, textColor=DARK,
        spaceAfter=4, leading=14,
    )
    styles['body_bullet'] = ParagraphStyle(
        'BodyBullet', fontName='Helvetica', fontSize=10, textColor=DARK,
        spaceAfter=3, leading=13, leftIndent=15,
    )
    styles['term'] = ParagraphStyle(
        'Term', fontName='Helvetica-Bold', fontSize=9, textColor=DARK,
    )
    styles['definition'] = ParagraphStyle(
        'Definition', fontName='Helvetica', fontSize=9, textColor=MUTED,
    )
    styles['accent'] = ParagraphStyle(
        'Accent', fontName='Helvetica-Bold', fontSize=10, textColor=TEAL,
    )
    styles['answer_key_title'] = ParagraphStyle(
        'AnswerKey', fontName='Helvetica-Bold', fontSize=14, textColor=TEAL,
        spaceBefore=20, spaceAfter=10,
    )

    return {
        'NAVY': NAVY, 'TEAL': TEAL, 'LIGHT': LIGHT, 'WHITE': WHITE,
        'DARK': DARK, 'MUTED': MUTED, 'OPTION_BG': OPTION_BG,
        **styles
    }


def _draw_header_banner(cv, doc, title, subtitle, styles):
    from reportlab.lib import colors
    from reportlab.lib.utils import simpleSplit
    S = styles

    cv.saveState()
    cv.setFillColor(S['NAVY'])
    cv.rect(0, doc.pagesize[1] - 80, doc.pagesize[0], 80, fill=True, stroke=False)
    cv.setFillColor(S['WHITE'])
    cv.setFont('Helvetica-Bold', 18)
    
    max_width = doc.pagesize[0] - 100
    if cv.stringWidth(title, 'Helvetica-Bold', 18) > max_width:
        title = simpleSplit(title, 'Helvetica-Bold', 18, max_width)[0] + '...'
    cv.drawRightString(doc.pagesize[0] - 40, doc.pagesize[1] - 45, title)
    
    cv.setFont('Helvetica', 10)
    cv.drawRightString(doc.pagesize[0] - 40, doc.pagesize[1] - 62, subtitle)
    cv.setFillColor(S['TEAL'])
    cv.rect(40, doc.pagesize[1] - 85, 3, 60, fill=True, stroke=False)
    cv.restoreState()


def _draw_page_footer(cv, doc):
    from reportlab.lib import colors
    cv.setFont('Helvetica', 8)
    cv.setFillColor(colors.gray)
    cv.drawString(40, 30, 'StudyMap')
    cv.drawRightString(doc.pagesize[0] - 40, 30, f'Page {cv.getPageNumber()}')


def safe_text(val, fallback=''):
    return str(val) if val else fallback


class GenerateSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        summary_type = request.data.get('type', 'cornell')

        if summary_type not in ['cornell', 'study', 'research']:
            return Response({'error': 'Type must be cornell, study, or research'}, status=status.HTTP_400_BAD_REQUEST)

        result = service.generate_summary(project_id, summary_type)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        summary = Summary.objects.create(
            project=project,
            type=summary_type,
            title=result.get('title', ''),
            data=result
        )

        return Response({
            'id': summary.id,
            'type': summary_type,
            'title': result.get('title', ''),
            'generated_at': summary.generated_at.isoformat(),
            **result
        })

    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id, owner=request.user)
        summaries = Summary.objects.filter(project=project).values('id', 'type', 'title', 'generated_at')
        return Response(list(summaries))


class SummaryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, summary_id):
        summary = get_object_or_404(Summary, id=summary_id, project_id=project_id, project__owner=request.user)
        return Response({
            'id': summary.id,
            'type': summary.type,
            'title': summary.title,
            'generated_at': summary.generated_at.isoformat(),
            **summary.data
        })

    def delete(self, request, project_id, summary_id):
        summary = get_object_or_404(Summary, id=summary_id, project_id=project_id, project__owner=request.user)
        summary.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def export_summary(request, project_id, summary_id):
    summary = get_object_or_404(Summary, id=summary_id, project_id=project_id)
    export_format = request.GET.get('format', 'json')

    if export_format == 'md':
        return _export_summary_md(summary)
    elif export_format == 'pdf':
        return _export_summary_pdf(summary)
    else:
        return HttpResponse('Format must be md or pdf', status=400, content_type='text/plain')


def _export_summary_md(summary):
    from .services import SummaryService
    service = SummaryService()
    text = service.format_summary_md(summary)
    response = HttpResponse(text, content_type='text/markdown')
    response['Content-Disposition'] = f'attachment; filename="{summary.title or "summary"}.md"'
    return response


def _export_summary_pdf(summary):
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

        pdf_buffer = BytesIO()

        def on_first_page(cv, doc):
            cv.saveState()
            _draw_header_banner(
                cv, doc, summary.title or f'{summary.type.title()} Summary',
                f"Generated {date.today()}", S,
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

        data = summary.data or {}

        if summary.type == 'cornell':
            story.extend(_build_cornell_pdf(data, S))
        elif summary.type == 'study':
            story.extend(_build_study_pdf(data, S))
        elif summary.type == 'research':
            story.extend(_build_research_pdf(data, S))

        doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{safe_text(summary.title, 60)}.pdf"'
        return response

    except Exception as e:
        import logging
        import traceback
        logging.error(f"Summary PDF export error: {e}\n{traceback.format_exc()}", exc_info=True)
        return HttpResponse(f'PDF export failed: {str(e)}', status=500, content_type='text/plain')


def _build_cornell_pdf(data, S):
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

    story = []
    NAVY, TEAL, LIGHT, WHITE, DARK, MUTED = S['NAVY'], S['TEAL'], S['LIGHT'], S['WHITE'], S['DARK'], S['MUTED']

    cue_questions = data.get('cue_questions', []) or []
    main_notes = data.get('main_notes', '') or ''
    summary_text = data.get('summary', '') or ''

    cue_block = []
    for q in cue_questions:
        cue_block.append(Paragraph(safe_text(q), S['body']))
    if cue_block:
        story.append(_section_card([
            Paragraph("Cue Questions", S['section']),
            Spacer(1, 4),
            *cue_block
        ], TEAL, S))
        story.append(Spacer(1, 12))

    if main_notes:
        story.append(_section_card([
            Paragraph("Main Notes", S['section']),
            Spacer(1, 4),
            Paragraph(safe_text(main_notes), S['body'])
        ], NAVY, S))
        story.append(Spacer(1, 12))

    if summary_text:
        story.append(_section_card([
            Paragraph("Summary", S['section']),
            Spacer(1, 4),
            Paragraph(safe_text(summary_text), S['body'])
        ], S['TEAL'], S))

    return story


def _build_study_pdf(data, S):
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

    story = []
    NAVY, TEAL, LIGHT, WHITE, DARK, MUTED = S['NAVY'], S['TEAL'], S['LIGHT'], S['WHITE'], S['DARK'], S['MUTED']

    sections = data.get('sections', []) or []
    overall = data.get('overall_summary', '') or ''

    accent_colors = [TEAL, NAVY, S['MUTED']]
    for i, section in enumerate(sections):
        color = accent_colors[i % len(accent_colors)]
        block = [
            Paragraph(safe_text(section.get('heading', '')), S['section']),
            Spacer(1, 4),
            Paragraph(safe_text(section.get('content', '')), S['body']),
        ]

        key_terms = section.get('key_terms', []) or []
        if key_terms:
            block.append(Spacer(1, 8))
            for kt in key_terms:
                tbl = Table(
                    [[Paragraph(f"<b>{safe_text(kt.get('term', ''))}</b>", S['term']),
                      Paragraph(safe_text(kt.get('definition', '')), S['definition'])]],
                    colWidths=[100, 410]
                )
                tbl.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ]))
                block.append(tbl)

        rm = section.get('remember_this', '')
        if rm:
            block.append(Spacer(1, 8))
            block.append(Paragraph(f"<i>{safe_text(rm)}</i>", S['accent']))

        story.append(_section_card(block, color, S))
        story.append(Spacer(1, 12))

    if overall:
        story.append(_section_card([
            Paragraph("Overall Summary", S['section']),
            Spacer(1, 4),
            Paragraph(safe_text(overall), S['body'])
        ], S['TEAL'], S))

    return story


def _build_research_pdf(data, S):
    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

    story = []
    NAVY, TEAL, LIGHT, WHITE, DARK, MUTED = S['NAVY'], S['TEAL'], S['LIGHT'], S['WHITE'], S['DARK'], S['MUTED']

    abstract = data.get('abstract', '') or ''
    methodology = data.get('methodology', '') or ''
    key_findings = data.get('key_findings', []) or []
    limitations = data.get('limitations', []) or []
    conclusions = data.get('conclusions', '') or ''
    further = data.get('further_reading_topics', []) or []

    if abstract:
        story.append(_section_card([
            Paragraph("Abstract", S['section']),
            Spacer(1, 4),
            Paragraph(safe_text(abstract), S['body'])
        ], S['NAVY'], S))
        story.append(Spacer(1, 12))

    if methodology:
        story.append(_section_card([
            Paragraph("Methodology", S['section']),
            Spacer(1, 4),
            Paragraph(safe_text(methodology), S['body'])
        ], S['TEAL'], S))
        story.append(Spacer(1, 12))

    if key_findings:
        block = [Paragraph("Key Findings", S['section']), Spacer(1, 4)]
        for f in key_findings:
            block.append(Paragraph(f"• {safe_text(f)}", S['body']))
        story.append(_section_card(block, NAVY, S))
        story.append(Spacer(1, 12))

    if limitations:
        block = [Paragraph("Limitations", S['section']), Spacer(1, 4)]
        for l in limitations:
            block.append(Paragraph(f"• {safe_text(l)}", S['body']))
        story.append(_section_card(block, S['MUTED'], S))
        story.append(Spacer(1, 12))

    if conclusions:
        story.append(_section_card([
            Paragraph("Conclusions", S['section']),
            Spacer(1, 4),
            Paragraph(safe_text(conclusions), S['body'])
        ], S['TEAL'], S))
        story.append(Spacer(1, 12))

    if further:
        block = [Paragraph("Further Reading", S['section']), Spacer(1, 4)]
        for t in further:
            block.append(Paragraph(f"• {safe_text(t)}", S['body']))
        story.append(_section_card(block, S['MUTED'], S))

    return story


def _section_card(block_contents, accent_color, S):
    from reportlab.platypus import Table, TableStyle, KeepTogether
    from reportlab.lib import colors

    card_inner = Table([[block_contents]], colWidths=[510])
    card_inner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), S['WHITE']),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E0')),
    ]))

    accent = Table([['']], colWidths=[5])
    accent.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), accent_color),
    ]))

    outer = Table([[accent, card_inner]], colWidths=[5, 510])
    outer.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    return KeepTogether(outer)