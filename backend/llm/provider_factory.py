from llm.providers.gemini_provider import GeminiProvider
from llm.providers.ollama_provider import OllamaProvider


class ProviderFactory:

    @staticmethod
    def get_provider(provider="gemini"):

        providers = {
            "gemini": GeminiProvider,
            "ollama": OllamaProvider,
        }

        provider = provider.lower()

        if provider not in providers:
            raise ValueError(f"Unsupported provider: {provider}")

        return providers[provider]()
