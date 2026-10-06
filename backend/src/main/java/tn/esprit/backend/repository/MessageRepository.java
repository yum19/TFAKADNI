package tn.esprit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.backend.entity.Message;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Full conversation between two users, oldest first.
     * Eagerly loads reactions and replyTo so mappers don't hit N+1.
     */
    @Query("""
        SELECT DISTINCT m FROM Message m
        LEFT JOIN FETCH m.reactions r
        LEFT JOIN FETCH m.replyTo rt
        WHERE (m.sender.id = :a AND m.receiver.id = :b)
           OR (m.sender.id = :b AND m.receiver.id = :a)
        ORDER BY m.timestamp ASC
    """)
    List<Message> findConversation(@Param("a") Long a, @Param("b") Long b);

    /**
     * Unread messages sent FROM senderId TO receiverId.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isRead = false
    """)
    List<Message> findUnreadMessages(@Param("senderId") Long senderId,
                                     @Param("receiverId") Long receiverId);

    /**
     * Count unread FROM fromId TO toId.
     */
    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.sender.id = :fromId AND m.receiver.id = :toId AND m.isRead = false
    """)
    long countUnread(@Param("fromId") Long fromId, @Param("toId") Long toId);

    /**
     * Bulk mark as read.
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Message m SET m.isRead = true, m.status = 'SEEN'
        WHERE m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isRead = false
    """)
    void markAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    /**
     * Last message per conversation partner for sidebar ordering.
     * Returns [partnerId, lastContent, lastTimestamp, unreadCount]
     */
    @Query(value = """
        SELECT partner_id,
               last_msg,
               last_ts,
               unread_count
        FROM (
            SELECT
                CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END AS partner_id,
                m.content   AS last_msg,
                m.timestamp AS last_ts,
                SUM(CASE WHEN m.receiver_id = :userId AND m.is_read = false THEN 1 ELSE 0 END)
                    OVER (PARTITION BY CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END)
                    AS unread_count,
                ROW_NUMBER() OVER (
                    PARTITION BY CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END
                    ORDER BY m.timestamp DESC
                ) AS rn
            FROM messages m
            WHERE m.sender_id = :userId OR m.receiver_id = :userId
        ) sub
        WHERE rn = 1
        ORDER BY last_ts DESC
    """, nativeQuery = true)
    List<Object[]> findLastMessagesForUser(@Param("userId") Long userId);
}