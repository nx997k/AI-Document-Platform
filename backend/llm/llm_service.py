from llm.provider_factory import ProviderFactory


class LLMService:

    def __init__(self, provider="gemini"):
        self.provider = ProviderFactory.get_provider(provider)

    def chat(self, question, context=""):
        return self.provider.chat(question, context)

    def generate_document(self, prompt, context=""):
        return self.provider.generate_document(prompt, context)