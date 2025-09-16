# GlobalBooks SOA Governance Policy

## 1. Versioning Strategy
- **REST API:** URL-based versioning (e.g., `/v1/orders`, `/v2/orders`).
- **SOAP API:** XML Namespace versioning (e.g., `http://globalbooks.com/catalog/v1`).
- **Lifecycle:** Active -> Deprecated (6 months notice) -> Sunset.

## 2. Service Level Agreements (SLAs)
- **Availability:** 99.9% for critical services (Orders), 99.5% for others.
- **Performance:** P95 response time < 200ms; P99 < 500ms.
- **Error Rate:** Server-side error rate (5xx) must be < 0.1%.

## 3. Deprecation Policy
- **Notice Period:** 12 months for major versions, 6 months for minor versions.
- **Communication:** Via Developer Portal, Status Page, and direct email to consumers.
- **Process:** Announce -> Publish Migration Guide -> Parallel Run -> Sunset -> Decommission.

## 4. Security Standards
- **REST Services:** Must be secured with OAuth 2.0 Bearer Tokens.
- **SOAP Services:** Must be secured with WS-Security UsernameToken Profile.
- **Transport:** TLS 1.2 or higher is mandatory for all external communication.

## 5. Monitoring & Compliance
- **Metrics:** All services must expose metrics for availability, latency, and error rates.
- **Logging:** All API calls must be logged. Sensitive data (PII) must be masked in logs.
- **Audits:** Annual security audits and quarterly SLA reviews are required.