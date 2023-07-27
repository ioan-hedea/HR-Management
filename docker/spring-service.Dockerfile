# syntax=docker/dockerfile:1.7

FROM gradle:8.10.2-jdk21-alpine AS builder
WORKDIR /workspace

COPY . .

ARG SERVICE_GRADLE_TASK
ARG SERVICE_DIR

RUN test -n "$SERVICE_GRADLE_TASK"
RUN test -n "$SERVICE_DIR"
RUN chmod +x ./gradlew
RUN ./gradlew --no-daemon ${SERVICE_GRADLE_TASK} -x test
RUN cp ${SERVICE_DIR}/build/libs/*.jar /tmp/app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /tmp/app.jar /app/app.jar

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
