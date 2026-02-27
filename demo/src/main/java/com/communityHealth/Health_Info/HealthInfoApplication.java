package com.communityHealth.Health_Info;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HealthInfoApplication {

	public static void main(String[] args) {
		// Load .env variables
		try {
			Dotenv dotenv = Dotenv.configure()
					.ignoreIfMissing()
					.load();
			
			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
			System.out.println(">>> Environment Variables Loaded Successfully");
			System.out.println(">>> DB_URL being used: " + System.getProperty("DB_URL"));
		} catch (Exception e) {
			System.err.println(">>> Warning: .env file not found or could not be read. Using system defaults.");
		}

		SpringApplication.run(HealthInfoApplication.class, args);
	}

}
