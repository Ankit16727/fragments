# tests/integration/post-fragments.hurl
# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
# Body of the request goes in ```...``` when it's a string
`This is a fragment!`

# 1. We expect to get back an HTTP 201
HTTP/1.1 401
# We have various assertions about the response that we want to check
[Asserts]
jsonpath "$.error.code" == 401
jsonpath "$.error.message" == "Unauthorized"

