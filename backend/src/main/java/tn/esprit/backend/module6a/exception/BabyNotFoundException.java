package tn.esprit.backend.module6a.exception;

public class BabyNotFoundException extends RuntimeException {
    public BabyNotFoundException(String message) {
        super(message);
    }
}