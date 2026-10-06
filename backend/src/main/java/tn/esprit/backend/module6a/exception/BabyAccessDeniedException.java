package tn.esprit.backend.module6a.exception;

public class BabyAccessDeniedException extends RuntimeException {
    public BabyAccessDeniedException(String message) {
        super(message);
    }
}