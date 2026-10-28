# ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---- runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --create-home appuser
COPY --from=build /workspace/target/warehouse-inventory.jar app.jar
USER appuser
# Render injects PORT; the app reads it via server.port=${PORT:8080}
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
