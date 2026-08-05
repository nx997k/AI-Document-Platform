from llm.providers.gemini_provider import GeminiProvider


class ProviderFactory:

    @staticmethod
    def get_provider(provider="gemini"):

        providers = {
            "gemini": GeminiProvider,
        }

        provider = provider.lower()

        if provider not in providers:
            raise ValueError(f"Unsupported provider: {provider}")

        return providers[provider]()