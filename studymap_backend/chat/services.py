import os
import json
import re
import time
import requests
from django.conf import settings

logger = __import__('logging').getLogger(__name__)


def with_retry(max_retries=3, base_delay=2):
    """Decorator to retry API calls on 429/500/502/503/504 errors"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    error_str = str(e)
                    should_retry = (
                        '429' in error_str or
                        '500' in error_str or
                        '502' in error_str or
                        '503' in error_str or
                        '504' in error_str or
                        'OpenRouter API' in error_str or
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


class OpenRouterService:
    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self):
        self.api_key = getattr(settings, 'OPENROUTER_API_KEY', os.getenv('OPENROUTER_API_KEY', ''))
        self.model = getattr(settings, 'OPENROUTER_MODEL', os.getenv('OPENROUTER_MODEL', 'openrouter/free'))
        
        if not self.api_key:
            raise Exception("OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file.")

    def build_context(self, project_id, session_id=None):
        from projects.models import Document, Note

        context_parts = []
        documents = Document.objects.filter(project_id=project_id, is_processed=True).order_by('-uploaded_at')
        notes = Note.objects.filter(project_id=project_id).order_by('-updated_at')

        if not documents.exists() and not notes.exists():
            return ''

        context_parts.append("=== PROJECT DOCUMENTS AND NOTES ===")
        
        for doc in documents:
            context_parts.append(f"\n--- DOCUMENT: {doc.title} ---\n{doc.raw_text[:30000]}\n")

        for note in notes:
            context_parts.append(f"\n--- NOTE: {note.title} ---\n{note.content[:5000]}\n")

        return '\n'.join(context_parts)

    def extract_sources(self, response_text, documents):
        sources = []
        response_lower = response_text.lower()
        first_50 = response_lower[:50]

        for doc in documents:
            doc_text_lower = doc.raw_text.lower()
            if len(doc_text_lower) < 50:
                continue

            chunk = doc_text_lower[:5000]
            if first_50 in chunk:
                match_pos = chunk.find(first_50)
                if match_pos >= 0:
                    start = max(0, match_pos - 50)
                    excerpt = doc.raw_text[start:start + 100]
                    page_est = match_pos // 2000 + 1
                    sources.append({
                        'doc_id': doc.id,
                        'doc_title': doc.title,
                        'excerpt': excerpt.strip(),
                        'page': page_est
                    })
                    if len(sources) >= 5:
                        break

        return sources

    @with_retry(max_retries=3, base_delay=2)
    def call_api(self, messages, system_prompt):
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:8000',
            'X-Title': 'StudyMap'
        }

        full_messages = [
            {'role': 'system', 'content': system_prompt}
        ]
        for msg in messages:
            full_messages.append({
                'role': msg['role'],
                'content': msg['content']
            })

        data = {
            'model': self.model,
            'messages': full_messages,
            'max_tokens': 4000,
            'temperature': 0.7
        }

        try:
            response = requests.post(
                f'{self.BASE_URL}/chat/completions',
                headers=headers,
                json=data,
                timeout=120
            )
            response.raise_for_status()
            result = response.json()
            if 'choices' not in result:
                raise Exception(f"OpenRouter API error: missing 'choices' in response: {result}")
            return result['choices'][0]['message']['content']
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API request error: {str(e)}")
        except (KeyError, json.JSONDecodeError) as e:
            raise Exception(f"OpenRouter API response error: {str(e)}")

    def chat_strict(self, messages, project_id):
        context = self.build_context(project_id)
        if not context:
            return {
                'content': 'Please upload documents or create notes before starting a chat.',
                'sources': []
            }

        system_prompt = """You are StudyMap AI. Answer ONLY using the documents and notes provided below.
If the answer is not in the documents, say: 'I could not find this in your documents.'
Always cite which document you used by writing [Source: Document Title].

{context}"""

        response_text = self.call_api(messages, system_prompt.format(context=context))

        from projects.models import Document
        documents = Document.objects.filter(project_id=project_id, is_processed=True)
        sources = self.extract_sources(response_text, documents)

        return {
            'content': response_text,
            'sources': sources
        }

    def chat_hybrid(self, messages, project_id):
        context = self.build_context(project_id)
        if not context:
            return {
                'content': 'Please upload documents or create notes before starting a chat.',
                'injected_thought': '',
                'sources': []
            }

        system_prompt = """You are StudyMap AI. Answer primarily from the documents and notes provided.

IMPORTANT: When you add your own knowledge or insights beyond what's in the documents, you MUST wrap them in <thought> tags like this:
<thought>Your extra insight or additional knowledge here</thought>

The <thought> tags will be displayed separately to the user as AI insights. Use them whenever you add information not found in the documents.

Always cite document sources with [Source: Document Title].

{context}"""

        response_text = self.call_api(messages, system_prompt.format(context=context))

        injected_thoughts = []
        content = response_text
        thought_pattern = re.compile(r'<thought>(.*?)</thought>', re.DOTALL)
        for match in thought_pattern.finditer(response_text):
            injected_thoughts.append(match.group(1).strip())
        content = thought_pattern.sub('', content)

        from projects.models import Document
        documents = Document.objects.filter(project_id=project_id, is_processed=True)
        sources = self.extract_sources(content, documents)

        return {
            'content': content.strip(),
            'injected_thought': '\n\n'.join(injected_thoughts),
            'sources': sources
        }

    def chat_search(self, messages, project_id):
        from projects.models import Document, Note

        documents = Document.objects.filter(project_id=project_id, is_processed=True)
        notes = Note.objects.filter(project_id=project_id)

        if not documents.exists() and not notes.exists():
            return {
                'content': 'Please upload documents first before using Discover mode.',
                'web_sources': []
            }

        doc_titles = [d.title for d in documents]
        doc_contents = '\n\n'.join([
            f"DOCUMENT: {d.title}\nCONTENT: {d.raw_text[:15000]}"
            for d in documents
        ])

        system_prompt = """You are a helpful research assistant. Your ONLY job is to recommend additional learning resources based on the user's question AND the specific documents they have uploaded.

CRITICAL RULES:
1. You MUST read the document content provided below
2. You MUST recommend resources that relate to the TOPICS in those documents
3. Do NOT make up topics or recommend resources about random subjects
4. If the documents are about philosophy, recommend philosophy resources
5. If the documents are about programming, recommend programming resources

USER QUESTION: """ + messages[-1]['content'] + """

UPLOADED DOCUMENTS:
""" + doc_contents + """

Your response must:
1. First identify 2-3 specific topics from the documents that relate to the user's question
2. Then recommend 5-8 resources specific to those topics

Format as JSON array:
[{{"title":"Resource Name","url":"https://example.com","snippet":"Why relevant","type":"Book"}}]

After the JSON, write 2 sentences about which document topics these resources help with."""

        response_text = self.call_api(messages, system_prompt)

        web_sources = []
        summary = response_text

        cleaned = re.sub(r'```json\s*', '', response_text)
        cleaned = re.sub(r'```\s*$', '', cleaned, flags=re.MULTILINE)

        json_pattern = re.compile(r'\[.*\]', re.DOTALL)
        for match in json_pattern.finditer(cleaned):
            try:
                sources_data = json.loads(match.group(0))
                web_sources = sources_data
                summary = response_text[:match.start()].strip()
                break
            except json.JSONDecodeError:
                continue

        return {
            'content': summary,
            'web_sources': web_sources
        }