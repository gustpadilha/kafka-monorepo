## Kafka Implementation (Monorepo)

Comprehensive documentation for the kafka-implementation monorepo. This project demonstrates a minimal microservices example using NestJS + Kafka (kafkajs), organized as a monorepo with local libs for logging and metrics.

This README uses Unix-style commands (bash) for examples.

---

## Table of Contents
- Project overview
- Architecture
- Repositories / folders
- Prerequisites
- Running locally with Docker Compose
- Building locally (monorepo)
- Services and endpoints
- Metrics (Prometheus) and metric registration
- Logging
- E2E testing
- Debugging & troubleshooting
- Contributing
- License

---

## Project overview

This monorepo contains three simple microservices (orders, payments, notifications) that communicate via Kafka topics. The code uses NestJS microservices with kafkajs under the hood. Local shared packages (under `libs/`) provide a Winston-based logger and Prometheus metrics helper.

Purpose: provide a small distributed example (produce message in orders -> payments consumes and emits processed/failed -> notifications receives payment events) and provide observability through Prometheus metrics and logs.

## Architecture

- Kafka (Confluent CP image) + Zookeeper
- MongoDB (used if services need persistence)
- Prometheus + Grafana for metrics and dashboards
- Services (NestJS):
  - orders: HTTP API that emits `order.created`
  - payments: consumes `order.created`, produces `payment.processed` or `payment.failed`
  - notifications: consumes payment events and reacts
- libs:
  - `@kafka/logger` — Winston wrapper used by services
  - `@kafka/metrics` — Prometheus helpers and lazy getters for metrics

## Repository layout (top-level)

```
docker-compose.yml
services/
  orders/
  payments/
  notifications/
libs/
  logger/
  metrics/
prometheus/
grafana/
tests/
```

## Prerequisites

- Docker & Docker Compose
- Node.js (for local builds and dev) — recommended Node 18+
- npm or your preferred package manager

## Running locally with Docker Compose

This repository includes a `docker-compose.yml` that brings up Kafka, Zookeeper, MongoDB, Prometheus, Grafana and the services.

To build and start everything:

```bash
# from repo root
docker-compose up -d --build
```

To rebuild and restart a single service (faster during development):

```bash
# rebuild only notifications
docker-compose build --no-cache notifications
docker-compose up -d notifications
```

View logs (follow):

```bash
docker-compose logs -f orders payments notifications kafka
```

## Building locally (monorepo)

If you prefer to build JS artifacts locally rather than via Docker multi-stage builds, you can compile the packages with your workspace scripts.

Examples (adjust depending on your package.json scripts):

```bash
# build metrics lib
cd libs/metrics && npm run build
# build services
cd ../../services/orders && npm run build
cd ../payments && npm run build
cd ../notifications && npm run build
```

Or, if you use npm workspaces, you may run a workspace build command (if configured):

```bash
npm run -w libs/metrics build
npm run -w services/orders build
```

If you change `libs`, rebuild the dependent services.

## Services and endpoints

- Orders:
  - HTTP API: POST /orders — creates an order and emits `order.created` to Kafka
  - Default port: 3001 (mapped in docker-compose)

Example request (curl):

```bash
curl -X POST http://localhost:3001/orders \
  -H 'Content-Type: application/json' \
  -d '{"amount":100, "items":["book","pen"]}'
```

- Payments:
  - No HTTP entrypoint by default in this minimal example (it consumes `order.created`)
  - Metrics and /metrics endpoint available (see Metrics section)

- Notifications:
  - Consumes payment events and logs notifications. Also exposes metrics.

## Metrics (Prometheus)

- The project exposes Prometheus metrics per service. Prometheus and Grafana are included in `docker-compose.yml` and a dashboard is available under `grafana/provisioning`.
- Services expose metrics endpoints on the ports configured in the compose file (see `docker-compose.yml`). Example mappings used in compose:
  - orders metrics: 9101
  - payments metrics: 9102
  - notifications metrics: 9103

Use curl to fetch metrics:

```bash
curl http://localhost:9101/metrics | grep orders_created_total
curl http://localhost:9102/metrics | egrep 'payments_processed_total|payments_failed_total|payment_processing_seconds'
curl http://localhost:9103/metrics | grep notifications_sent_total
```

Notes about metrics implementation:
- The shared `libs/metrics` uses lazy getters for metrics (e.g. `getOrdersCreatedCounter()`, `getPaymentsFailedCounter()`, `getNotificationsCounter()`), so metrics are only registered when a service actually uses them. This prevents all metrics from appearing in every service with zero value.
- If you change metric definitions, rebuild `libs/metrics` and dependent services to update `dist` artifacts.

## Logging

- The project uses a shared `@kafka/logger` (Winston). Services log structured messages; check container logs with `docker-compose logs`.
- Environment variables may tweak logging level. Check `libs/logger` for configuration.

## E2E testing

Manual E2E steps (bash):

```bash
# Start services
docker-compose up -d --build kafka zookeeper orders payments notifications

# Wait for orders HTTP to be ready (check with curl)
until curl -sSf http://localhost:3001/health >/dev/null 2>&1; do
  echo "waiting for orders..."; sleep 1;
done

# Create a test order
curl -s -X POST http://localhost:3001/orders -H 'Content-Type: application/json' -d '{"amount":42}'

# Inspect Kafka consumer groups (run inside kafka container)
KAFKA_CONTAINER=$(docker-compose ps -q kafka)
docker exec -it $KAFKA_CONTAINER sh -c "kafka-consumer-groups --bootstrap-server localhost:9092 --list"
docker exec -it $KAFKA_CONTAINER sh -c "kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group payments-consumer-server"

# Fetch metrics to verify increments
curl http://localhost:9102/metrics | egrep 'payments_processed_total|payments_failed_total'
curl http://localhost:9103/metrics | grep notifications_sent_total
```

## Debugging & troubleshooting

- Consumer empty assignment (memberAssignment: {}):
  - Common root causes:
    - Event handlers are not registered with the Nest microservice server (handlers must be declared in controllers/providers properly so Nest registers them).
    - Duplicate consumers in the same process (for instance a ClientKafka reply consumer and the server consumer using the same group); avoid creating two consumers with the same consumer group in one process.
  - Quick checks:
    - Inspect broker logs (`docker-compose logs kafka`) for join/rebalance messages.
    - Describe consumer group:
      ```bash
      docker exec -it $(docker-compose ps -q kafka) sh -c "kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group <group-name>"
      ```

- KafkaJS noisy partitioner warning:
  - The repo sets `KAFKAJS_NO_PARTITIONER_WARNING=1` to suppress non-actionable warnings. You can still enable `DEBUG=kafkajs:*` temporarily when you need deeper tracing.

- Topic creation/leader election transient errors:
  - You may see occasional transient errors like `no leader for topic-partition...` while topics are being created; these are usually transient during initial setup.

## Common environment variables

- KAFKA_BROKERS: comma-separated list (default in compose: `kafka:9092`)
- KAFKA_CLIENT_ID: client id used by services (set per-service in `docker-compose.yml`)
- PAYMENTS_CONSUMER_GROUP / NOTIFICATIONS_CONSUMER_GROUP: explicit consumer groups used by the services
- KAFKAJS_NO_PARTITIONER_WARNING=1: suppresses kafkaJS partitioner warning

Example (in `docker-compose.yml`):

```yaml
services:
  payments:
    environment:
      - KAFKA_BROKERS=kafka:9092
      - PAYMENTS_CONSUMER_GROUP=payments-consumer
      - KAFKA_CLIENT_ID=payments-client
      - KAFKAJS_NO_PARTITIONER_WARNING=1
```

## Contributing

- If you add new metrics, prefer the lazy getter pattern in `libs/metrics/src/metrics.ts` so metrics are registered only when used by a service.
- Keep controllers responsible for `@EventPattern` handlers so Nest registers subscriptions when the microservice server starts.

Suggested workflow:

1. Create feature branch
2. Add code and tests
3. Rebuild the affected `libs` packages and services
4. Run the integration tests or the manual steps above

## Troubleshooting checklist

- Services not receiving messages:
  - Check `docker-compose logs` for the service and `kafka` logs for consumer group joins.
  - Verify consumer groups: `kafka-consumer-groups --describe --group <group>`
  - Ensure handlers are registered in controllers and the Nest microservice server is started.

- Metrics missing or showing zero:
  - Confirm service is calling the getter for the metric (e.g. `getPaymentsFailedCounter()`).
  - Rebuild the `libs/metrics` and services to ensure `dist` artifacts are up-to-date.

## Useful commands (summary)

```bash
# Start everything
docker-compose up -d --build

# Rebuild a single service
docker-compose build --no-cache notifications
docker-compose up -d notifications

# Follow logs
docker-compose logs -f orders payments notifications kafka

# Post an order
curl -X POST http://localhost:3001/orders -H 'Content-Type: application/json' -d '{"amount":100}'

# Fetch metrics
curl http://localhost:9102/metrics | egrep 'payments_processed_total|payments_failed_total'

# Describe consumer groups
docker exec -it $(docker-compose ps -q kafka) sh -c "kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group payments-consumer-server"
```

## License

MIT

