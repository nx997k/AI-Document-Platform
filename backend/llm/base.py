from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):

    @abstractmethod
    def chat(self, question, context=""):
        pass

    @abstractmethod
    def generate_document(self, prompt, context=""):
        pass