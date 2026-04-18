import json
import time
import requests
from django.conf import settings
import os
import logging
import re

from prompts import FLASHCARDS_PROMPT, QUIZ_PROMPT, ENHANCE_NOTE_PROMPT

logger = logging.getLogger(__name__)

VALID_BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
VALID_CORRECT_OPTIONS = ['a', 'b', 'c', 'd']


class RetryError(Exception):
    """Custom exception for retry logic"""
    pass


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


def validate_quiz_questions(questions, expected_count):
    """Validate quiz questions output"""
    errors = []
    
    if not questions:
        errors.append("No questions generated")
        return errors
    
    if len(questions) < expected_count:
        errors.append(f"Expected {expected_count} questions, got {len(questions)}")
    
    bloom_level_mapping = {
        'remember': 'remember', 'remember/understand': 'remember', 'remember understand': 'remember',
        'understand': 'understand', 'understanding': 'understand',
        'apply': 'apply', 'application': 'apply',
        'analyze': 'analyze', 'analysis': 'analyze', 'analysis/apply': 'analyze',
        'evaluate': 'evaluate', 'evaluation': 'evaluate',
        'create': 'create', 'creation': 'create'
    }
    
    for i, q in enumerate(questions):
        required_fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'explanation', 'bloom_level']
        
        for field in required_fields:
            if field not in q or not q.get(field):
                errors.append(f"Question {i+1}: missing or empty '{field}'")
        
        bloom = q.get('bloom_level', '').lower().strip()
        if bloom not in VALID_BLOOM_LEVELS:
            mapped = bloom_level_mapping.get(bloom)
            if mapped:
                q['bloom_level'] = mapped
            else:
                errors.append(f"Question {i+1}: bloom_level must be one of {VALID_BLOOM_LEVELS}, got '{q.get('bloom_level')}'")
        
        if q.get('correct_option') and q['correct_option'].lower() not in VALID_CORRECT_OPTIONS:
            errors.append(f"Question {i+1}: correct_option must be 'a', 'b', 'c', or 'd', got '{q.get('correct_option')}'")
    
    return errors


def validate_flashcards(cards, expected_count):
    """Validate flashcards output"""
    errors = []
    
    if not cards:
        errors.append("No flashcards generated")
        return errors
    
    if len(cards) < expected_count:
        errors.append(f"Expected {expected_count} cards, got {len(cards)}")
    
    for i, card in enumerate(cards):
        required_fields = ['front', 'back']
        
        for field in required_fields:
            if field not in card or not card.get(field):
                errors.append(f"Card {i+1}: missing or empty '{field}'")
        
        if card.get('difficulty') and card['difficulty'] not in ['easy', 'medium', 'hard']:
            errors.append(f"Card {i+1}: difficulty must be 'easy', 'medium', or 'hard', got '{card.get('difficulty')}'")
    
    return errors


class GenerationService:
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
            result = response.json()
            
            if not result:
                raise Exception("Empty response from API - no JSON body")
            
            if 'choices' not in result or not result['choices']:
                raise Exception("Empty response from API - no choices")
            
            message = result['choices'][0].get('message', {})
            content = message.get('content')
            
            if not content:
                raise Exception("No content in API response - empty message")
            
            logger.info(f"API response received: {len(content)} chars")
            return content
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise Exception(f"OpenRouter API error: {str(e)}")
        except (KeyError, IndexError, TypeError) as e:
            logger.error(f"API response parsing failed: {e}, result: {result if 'result' in locals() else 'N/A'}")
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

    @with_retry(max_retries=3, base_delay=2)
    def generate_flashcards(self, project_id, count=15):
        context = self.build_context(project_id)
        if not context:
            return {'error': 'Please upload documents before generating flashcards'}

        easy_count = int(count * 0.4)
        medium_count = int(count * 0.4)
        hard_count = count - easy_count - medium_count

        system_prompt = FLASHCARDS_PROMPT.format(
            count=count,
            easy_count=easy_count,
            medium_count=medium_count,
            hard_count=hard_count,
            context=''
        )
        user_prompt = f"Context:\n{context}\n\nGenerate {count} flashcards:"

        response = self.call_api(system_prompt, user_prompt)

        try:
            cards = json.loads(response)
        except json.JSONDecodeError:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                cards = json.loads(json_match.group(0))
            else:
                raise Exception("Failed to parse flashcards response - invalid JSON")

        errors = validate_flashcards(cards, count)
        if errors:
            raise Exception(f"Flashcard validation failed: {'; '.join(errors)}")

        return cards[:count]

    @with_retry(max_retries=3, base_delay=2)
    def generate_quiz(self, project_id, count=15):
        context = self.build_context(project_id)
        if not context:
            return {'error': 'Please upload documents before generating quiz'}

        remember_count = int(count * 0.35)
        apply_count = int(count * 0.35)
        evaluate_count = count - remember_count - apply_count

        system_prompt = QUIZ_PROMPT.format(
            count=count,
            remember_count=remember_count,
            apply_count=apply_count,
            evaluate_count=evaluate_count,
            context=''
        )

        user_prompt = f"Context:\n{context}\n\nGenerate {count} quiz questions:"

        response = self.call_api(system_prompt, user_prompt)

        logger.info(f"Quiz raw response (first 500 chars): {response[:500]}")
        
        try:
            questions = json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}")
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group(0))
            else:
                raise Exception("Failed to parse quiz response - invalid JSON")

        errors = validate_quiz_questions(questions, count)
        if errors:
            raise Exception(f"Quiz validation failed: {'; '.join(errors)}")

        return questions[:count]

    @with_retry(max_retries=3, base_delay=2)
    def enhance_note(self, note_content):
        system_prompt = ENHANCE_NOTE_PROMPT

        user_prompt = f"Enhance this note:\n{note_content}"

        response = self.call_api(system_prompt, user_prompt)
        return response