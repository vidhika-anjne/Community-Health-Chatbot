package com.communityHealth.Health_Info.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AIConfig {

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3}")
    private String ollamaModel;

    /**
     * All-MiniLM-L6-v2 (quantized) — runs 100% on CPU, no GPU needed.
     * Produces 384-dimensional vectors used for semantic similarity search.
     */
    @Bean
    public EmbeddingModel embeddingModel() {
        return new AllMiniLmL6V2QuantizedEmbeddingModel();
    }

    /**
     * Ollama chat model — free, runs locally.
     * Requires Ollama installed: https://ollama.com
     * Then run: ollama pull llama3
     */
    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OllamaChatModel.builder()
                .baseUrl(ollamaBaseUrl)
                .modelName(ollamaModel)
                .temperature(0.3)          // low temperature = focused, factual answers
                .timeout(Duration.ofSeconds(120))
                .build();
    }
}
