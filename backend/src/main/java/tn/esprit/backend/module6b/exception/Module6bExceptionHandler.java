package tn.esprit.backend.module6b.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class Module6bExceptionHandler {

    @ExceptionHandler(PostpartumRequestException.class)
    public ResponseEntity<Module6bApiError> handleRequest(
            PostpartumRequestException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "POSTPARTUM_REQUEST_ERROR", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(PostpartumRecordMissingException.class)
    public ResponseEntity<Module6bApiError> handleMissing(
            PostpartumRecordMissingException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "POSTPARTUM_RECORD_MISSING", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(PostpartumAccountContextException.class)
    public ResponseEntity<Module6bApiError> handleAccount(
            PostpartumAccountContextException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "POSTPARTUM_ACCOUNT_CONTEXT_ERROR", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(PostpartumOwnershipException.class)
    public ResponseEntity<Module6bApiError> handleOwnership(
            PostpartumOwnershipException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.FORBIDDEN, "POSTPARTUM_OWNERSHIP_DENIED", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(PostpartumLinkedDataException.class)
    public ResponseEntity<Module6bApiError> handleLinkedData(
            PostpartumLinkedDataException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "POSTPARTUM_LINKED_DATA_MISSING", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(PostpartumAiBridgeException.class)
    public ResponseEntity<Module6bApiError> handleAiBridge(
            PostpartumAiBridgeException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_GATEWAY, "POSTPARTUM_AI_BRIDGE_ERROR", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Module6bApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> validationErrors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = error instanceof FieldError fieldError
                    ? fieldError.getField()
                    : error.getObjectName();
            validationErrors.put(field, error.getDefaultMessage());
        });

        Module6bApiError apiError = Module6bApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("POSTPARTUM_VALIDATION_ERROR")
                .message("Validation failed")
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Module6bApiError> handleConstraint(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "POSTPARTUM_CONSTRAINT_ERROR", ex.getMessage(), request.getRequestURI());
    }
        @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Module6bApiError> handleMissingParam(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "POSTPARTUM_MISSING_PARAMETER", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Module6bApiError> handleIntegrity(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.CONFLICT, "POSTPARTUM_DATA_INTEGRITY_ERROR", "Database constraint violation", request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Module6bApiError> handleFallback(
            Exception ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "POSTPARTUM_INTERNAL_ERROR", "An internal postpartum module error occurred", request.getRequestURI());
    }

    private ResponseEntity<Module6bApiError> build(
            HttpStatus status,
            String error,
            String message,
            String path
    ) {
        Module6bApiError body = Module6bApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .message(message)
                .path(path)
                .build();

        return ResponseEntity.status(status).body(body);
    }
}