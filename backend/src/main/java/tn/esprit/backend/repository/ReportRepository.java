package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.backend.entity.Report;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);

    long countByPostId(Long postId);

    // Eagerly load post and reporter to avoid LazyInitializationException during DTO mapping
    @Query("SELECT r FROM Report r JOIN FETCH r.post JOIN FETCH r.reporter")
    List<Report> findAllWithDetails();
}