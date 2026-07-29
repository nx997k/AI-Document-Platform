from llm.providers.ollama_provider import OllamaProvider


class ProviderFactory:

    @staticmethod
    def get_provider(provider="ollama"):

        provider = provider.lower()

        if provider == "ollama":
            return OllamaProvider()

        raise ValueError(f"Unknown provider: {provider}")