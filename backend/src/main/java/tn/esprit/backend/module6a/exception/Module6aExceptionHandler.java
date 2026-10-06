package tn.esprit.backend.module6a.exception;

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
public class Module6aExceptionHandler {
    @ExceptionHandler(BabyNotFoundException.class)
    public ResponseEntity<ApiError> handleBabyNotFound(
            BabyNotFoundException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "BABY_NOT_FOUND", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(Module6aResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(
            Module6aResourceNotFoundException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.NOT_FOUND, "MODULE6A_RESOURCE_NOT_FOUND", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(BabyAccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            BabyAccessDeniedException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.FORBIDDEN, "BABY_ACCESS_DENIED", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler({
            Module6aBadRequestException.class,
            InvalidDateRangeException.class,
            InvalidEnumValueException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ApiError> handleBadRequest(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        return build(
                HttpStatus.BAD_REQUEST,
                "MODULE6A_BAD_REQUEST",
                ex.getMessage(),
                request.getRequestURI()
        );
    }
    @ExceptionHandler(PredictionDataInsufficientException.class)
    public ResponseEntity<ApiError> handlePredictionInsufficient(
            PredictionDataInsufficientException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "PREDICTION_DATA_INSUFFICIENT", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(Module6aConflictException.class)
    public ResponseEntity<ApiError> handleConflict(
            Module6aConflictException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.CONFLICT, "MODULE6A_CONFLICT", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(Module6aBusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(
            Module6aBusinessException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "MODULE6A_BUSINESS_RULE", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> validationErrors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = error instanceof FieldError fieldError
                    ? fieldError.getField()
                    : error.getObjectName();
            String message = error.getDefaultMessage();
            validationErrors.put(field, message);
        });

        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message("Erreur de validation des champs")
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(apiError);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "CONSTRAINT_VIOLATION", ex.getMessage(), request.getRequestURI());
    }



    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER", ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", "Conflit de données ou contrainte base de données violée", request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(
            Exception ex,
            HttpServletRequest request
    ) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "MODULE6A_INTERNAL_ERROR", "Une erreur interne est survenue dans le module baby care", request.getRequestURI());
    }

    private ResponseEntity<ApiError> build(
            HttpStatus status,
            String error,
            String message,
            String path
    ) {
        ApiError apiError = ApiError.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(error)
                .message(message)
                .path(path)
                .build();

        return ResponseEntity.status(status).body(apiError);
    }
}