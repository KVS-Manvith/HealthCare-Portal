package com.manvith.healthcare_backend.config;

import java.util.Arrays;
import java.util.LinkedHashSet;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.persistence.EntityManagerFactory;

@Configuration
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = true)
public class FlywayConfig {

    @Bean(name = "flyway", initMethod = "migrate")
    Flyway flyway(
            DataSource dataSource,
            org.springframework.core.env.Environment environment
    ) {
        String[] locations = environment.getProperty("spring.flyway.locations", String[].class);
        if (locations == null || locations.length == 0) {
            locations = new String[]{"classpath:db/migration"};
        }

        boolean baselineOnMigrate = environment.getProperty(
                "spring.flyway.baseline-on-migrate",
                Boolean.class,
                true
        );

        return Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(baselineOnMigrate)
                .locations(locations)
                .load();
    }

    @Bean
    static BeanFactoryPostProcessor entityManagerFactoryDependsOnFlyway() {
        return new BeanFactoryPostProcessor() {
            @Override
            public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
                String[] emfBeanNames = beanFactory.getBeanNamesForType(EntityManagerFactory.class, true, false);
                for (String emfBeanName : emfBeanNames) {
                    var definition = beanFactory.getBeanDefinition(emfBeanName);
                    String[] dependsOn = definition.getDependsOn();
                    if (dependsOn == null || dependsOn.length == 0) {
                        definition.setDependsOn("flyway");
                        continue;
                    }

                    LinkedHashSet<String> allDependencies = new LinkedHashSet<>(Arrays.asList(dependsOn));
                    allDependencies.add("flyway");
                    definition.setDependsOn(allDependencies.toArray(String[]::new));
                }
            }
        };
    }
}
