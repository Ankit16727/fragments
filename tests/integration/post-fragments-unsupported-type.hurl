# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments
Content-Type: application/unsupported-type
# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1
# Body of the request 
`This is a fragment!`

# We excpect to get an 415 response
HTTP/1.1 415
# The error message should be "Invalid Content Type"
[Asserts]
jsonpath "$.error" == "Invalid Content Type"
