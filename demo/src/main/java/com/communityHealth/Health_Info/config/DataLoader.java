package com.communityHealth.Health_Info.config;

import com.communityHealth.Health_Info.model.Article;
import com.communityHealth.Health_Info.repository.ArticleRepository;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {
    private final ArticleRepository articleRepository;
    private final EmbeddingModel embeddingModel;

    @Override
    public void run(String... args) {
        if (articleRepository.count() == 0) {
            // 1. Fever Protocol Document
            String feverContent = "# Fever Guidelines\n" +
                         "1. Drink plenty of fluids (Water, ORS).\n" +
                         "2. Rest in a well-ventilated room.\n" +
                         "3. Monitor temperature every 6 hours.\n" +
                         "**Red Flags**: High fever (>103F), seizures, or confusion.";
            articleRepository.save(Article.builder()
                .title("Fever Management & Hydration")
                .content(feverContent)
                .embeddingJson(floatArrayToString(embeddingModel.embed(feverContent).content().vector()))
                .tags(List.of("fever", "emergency", "pediatrics"))
                .verified(true)
                .language("English")
                .build());

            // 2. Dengue Awareness Document
            String dengueContent = "# Dengue Prevention\n" +
                         "- Eliminate standing water around the home.\n" +
                         "- Use mosquito nets and repellents.\n" +
                         "- Symptoms: High fever, severe headache, muscle/joint pain.\n" +
                         "**Warning**: Consult a doctor if you experience bleeding or rapid pulse.";
            articleRepository.save(Article.builder()
                .title("Dengue Awareness & Prevention")
                .content(dengueContent)
                .embeddingJson(floatArrayToString(embeddingModel.embed(dengueContent).content().vector()))
                .tags(List.of("dengue", "mosquito", "tropical"))
                .verified(true)
                .language("English")
                .build());

            // 3. Vaccine Schedule Document
            String vaccineContent = "# Essential Vaccines\n" +
                         "1. BCG (at birth)\n" +
                         "2. OPV & DPT (6, 10, 14 weeks)\n" +
                         "3. MMR (9 months & 1.5 years)\n" +
                         "Regular checks at primary health centers are vital.";
            articleRepository.save(Article.builder()
                .title("Childhood Vaccination Schedule")
                .content(vaccineContent)
                .embeddingJson(floatArrayToString(embeddingModel.embed(vaccineContent).content().vector()))
                .tags(List.of("vaccine", "childcare", "prevention"))
                .verified(true)
                .language("English")
                .build());

            // 4. Hygiene Protocol
            String hygieneContent = "# Hygiene Rules\n" +
                         "Wash hands with soap for at least 20 seconds before eating and after using the restroom.";
            articleRepository.save(Article.builder()
                .title("Handwashing & Sanitation")
                .content(hygieneContent)
                .embeddingJson(floatArrayToString(embeddingModel.embed(hygieneContent).content().vector()))
                .tags(List.of("hygiene", "prevention", "cholera", "covid19"))
                .verified(true)
                .language("English")
                .build());
        }
    }

    /** Serialises a float[] to a comma-separated string for TEXT storage. */
    private static String floatArrayToString(float[] v) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(v[i]);
        }
        return sb.toString();
    }
}
