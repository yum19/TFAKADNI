package tn.esprit.backend.service;

import tn.esprit.backend.dto.SavedPostResponseDTO;

import java.util.List;

public interface SavedPostService {

    /** Toggle save/unsave. Returns true if now saved, false if unsaved. */
    boolean toggleSave(String email, Long postId);

    /** Returns true if the given user has saved the given post. */
    boolean isSaved(String email, Long postId);

    /** All posts saved by the user, newest first. */
    List<SavedPostResponseDTO> getSavedPosts(String email);

    /** Count of saved posts for the user. */
    long countSaved(String email);
}