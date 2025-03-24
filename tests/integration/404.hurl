# Invalid route
GET http://localhost:8080/no-such-route

# Expecting an HTTP 1.1 404 response
HTTP/1.1 404

# Checking the status, error code and the message
[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "not found"
