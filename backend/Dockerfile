FROM golang:alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server

FROM alpine:3.21

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --from=builder /app/server .

RUN mkdir -p /data && chown app:app /data
USER app

ENV DB_PATH=/data/data.db

EXPOSE 8080
CMD ["./server"]
