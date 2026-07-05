# terraform/uxcue

**DEFERRED (D016).** All AWS infrastructure (Cognito, API Gateway, Lambda,
DynamoDB, S3, CloudFront, budgets, DNS) is Terraform-managed here, but is not
built until cloud alpha (Phase 5) is revisited.

Planned module layout and resource names are in docs/05. Resource names use the
`uxcue-*` convention (docs/14 O006) — e.g. DynamoDB `uxcue-{env}`, buckets
`uxcue-{env}-*`, Cognito `uxcue-{env}`, DNS `uxcue.tools.ktek.cloud` — to be
applied from the first `UXL-INFRA-001` run.

The landing-page module (`modules/landing/`, Release 7 Track A) is likewise
deferred; Chrome Web Store publish is tracked in GitHub issue #1.
