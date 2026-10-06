package tn.esprit.backend.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import tn.esprit.backend.dto.PostNotificationDTO;
import tn.esprit.backend.dto.ReportRequestDTO;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.entity.Report;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PostRepository;
import tn.esprit.backend.repository.ReportRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.ReportService;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private static final long REPORT_THRESHOLD = 1;

    private final ReportRepository reportRepository;
    private final PostRepository   postRepository;
    private final UserRepository   userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void reportPost(String reporterEmail, ReportRequestDTO dto) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + reporterEmail));

        Post post = postRepository.findById(dto.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + dto.getPostId()));

        if (reportRepository.existsByPostIdAndReporterId(post.getId(), reporter.getId())) {
            throw new IllegalStateException("You have already reported this post");
        }

        Report report = Report.builder()
                .post(post)
                .reporter(reporter)
                .reason(dto.getReason())
                .details(dto.getDetails())
                .build();
        reportRepository.save(report);

        // Notify the post owner
        String ownerEmail = post.getUser().getEmail();
        notifyUser(ownerEmail, "POST_REPORTED", post.getId(),
                "⚠️ Your post has been reported anonymously. Please review our community guidelines.");

        log.info("[Report] Post {} reported by {}. Notified owner {}", post.getId(), reporterEmail, ownerEmail);

        long reportCount = reportRepository.countByPostId(post.getId());
        if (reportCount > REPORT_THRESHOLD) {
            log.info("[Report] Post {} exceeded threshold ({} reports). Auto-deleting.", post.getId(), reportCount);

            notifyUser(ownerEmail, "POST_DELETED", post.getId(),
                    "🚫 Your post has been removed due to multiple community reports.");

            // Clear associations to avoid FK constraint violations, then delete
            post.getCommentaires().clear();
            post.getReactions().clear();
            post.getImages().clear();
            post.getReports().clear();
            postRepository.saveAndFlush(post);
            postRepository.deleteById(post.getId());
        }
    }

    private void notifyUser(String email, String type, Long postId, String message) {
        try {
            PostNotificationDTO notif = new PostNotificationDTO(type, postId, message);
            messagingTemplate.convertAndSendToUser(email, "/queue/post-notifications", notif);
        } catch (Exception ex) {
            log.warn("[Report] Could not send WebSocket notification to {}: {}", email, ex.getMessage());
        }
    }
}