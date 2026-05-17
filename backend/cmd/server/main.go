package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/auth"
	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/db"
	"github.com/Cheesemanxl/cody-owens-portfolio-2026/backend/internal/handlers"
)

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data.db"
	}
	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer database.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(auth.Middleware)

	r.Get("/api/me", handlers.Me(database))
	r.Get("/api/profile/{userId}", handlers.Profile(database))
	r.Get("/api/cards", handlers.Cards(database))
	r.Post("/api/cards", handlers.CreateCard(database))
	r.Patch("/api/cards/{id}", handlers.MoveCard(database))
	r.Delete("/api/cards/{id}", handlers.DeleteCard(database))

	log.Println("backend listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
