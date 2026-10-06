package tn.esprit.backend.exception;

/** Exception métier générique (400 Bad Request) */
public class AppException extends RuntimeException {
    public AppException(String message) { super(message); }
}