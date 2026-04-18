import json
import time
import requests
from django.conf import settings
import os
import logging

from prompts import SUMMARY_CORNELL_PROMPT, SUMMARY_STUDY_PROMPT, SUMMARY_RESEARCH_PROMPT

logger = logging.getLogger(__name__)


def with_retry(max_retries=3, base_delay=2):
    """Decorator to retry API calls on 500/502/503/504 errors"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    error_str = str(e)
                    should_retry = (
                        '500' in error_str or 
                        '502' in error_str or 
                        '503' in error_str or 
                        '504' in error_str or
                        'OpenRouter API error' in error_str or
                        'Connection error' in error_str or
                        'Timeout' in error_str
                    )
                    if should_retry and attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"API error (attempt {attempt + 1}/{max_retries}), retrying in {delay}s: {error_str}")
                        time.sleep(delay)
                    else:
                        raise
        return wrapper
    return decorator


class SummaryService:
    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self):
        self.api_key = getattr(settings, 'OPENROUTER_API_KEY', os.getenv('OPENROUTER_API_KEY', ''))
        self.model = getattr(settings, 'OPENROUTER_MODEL', os.getenv('OPENROUTER_MODEL', 'openrouter/free'))

    @with_retry(max_retries=3, base_delay=2)
    def call_api(self, system_prompt, user_prompt):
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:8000',
            'X-Title': 'StudyMap'
        }

        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ]

        data = {
            'model': self.model,
            'messages': messages,
            'max_tokens': 4000,
            'temperature': 0.7
        }

        try:
            response = requests.post(
                f'{self.BASE_URL}/chat/completions',
                headers=headers,
                json=data,
                timeout=180
            )
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API error: {str(e)}")

    def build_context(self, project_id):
        from projects.models import Document, Note

        context_parts = []
        documents = Document.objects.filter(project_id=project_id, is_processed=True).order_by('-uploaded_at')
        notes = Note.objects.filter(project_id=project_id).order_by('-updated_at')

        max_chars = 80000
        total_chars = 0

        for doc in documents:
            if total_chars >= max_chars:
                break
            raw_text = doc.raw_text[:max_chars - total_chars] if total_chars > 0 else doc.raw_text
            context_parts.append(f"=== DOCUMENT: {doc.title} ===\n{raw_text}\n")
            total_chars += len(raw_text) + 50

        for note in notes:
            if total_chars >= max_chars:
                break
            content = note.content[:max_chars - total_chars] if total_chars > 0 else note.content
            context_parts.append(f"=== NOTE: {note.title} ===\n{content}\n")
            total_chars += len(content) + 50

        return '\n'.join(context_parts)

    def generate_summary(self, project_id, summary_type):
        context = self.build_context(project_id)
        if not context:
            return {'error': 'Please upload documents before generating summary'}

        if summary_type == 'cornell':
            system_prompt = SUMMARY_CORNELL_PROMPT
        elif summary_type == 'study':
            system_prompt = SUMMARY_STUDY_PROMPT
        else:  # research
            system_prompt = SUMMARY_RESEARCH_PROMPT

        user_prompt = f"Context:\n{context}\n\nCreate a {summary_type} summary:"

        response = self.call_api(system_prompt, user_prompt)

        try:
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                data = json.loads(json_match.group(0))
                return data
            return json.loads(response)
        except (json.JSONDecodeError, ValueError):
            raise Exception("Failed to parse summary response")