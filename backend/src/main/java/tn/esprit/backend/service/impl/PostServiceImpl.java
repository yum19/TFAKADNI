package tn.esprit.backend.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.Post;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.exception.ResourceNotFoundException;
import tn.esprit.backend.repository.PostRepository;
import tn.esprit.backend.repository.UserRepository;
import tn.esprit.backend.service.HarmfulContentService;
import tn.esprit.backend.service.PostService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceImpl implements PostService {

    private final PostRepository        postRepository;
    private final UserRepository        userRepository;
    private final HarmfulContentService harmfulContentService;

    @Override
    public Post creer(String email, Post post) {
        User user = getUserByEmail(email);
        post.setUser(user);
        if (post.getDate()    == null) post.setDate(LocalDateTime.now());
        if (post.getLikes()   == null) post.setLikes(0);
        if (post.getAnonyme() == null) post.setAnonyme(false);
        if (post.getImages()  == null) post.setImages(new ArrayList<>());

        Post saved = postRepository.save(post);

        // Fire async analysis — Angular will poll for the result
        // Pass image URLs so the ML service can also scan images
        List<String> imageUrls = saved.getImages() != null ? saved.getImages() : List.of();
        harmfulContentService.analyseAsync(saved.getId(), saved.getContenu(), imageUrls);

        return saved;
    }

    @Override
    public List<Post> recupererTout() {
        return postRepository.findAll();
    }

    @Override
    public Post recupererParId(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post non trouvé"));
    }

    @Override
    public Post mettreAJour(String email, Long id, Post post) {
        User  user    = getUserByEmail(email);
        Post  existant = postRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Post non trouvé ou accès refusé"));

        existant.setContenu(post.getContenu());
        existant.setTag(post.getTag());
        existant.setAnonyme(post.getAnonyme());
        existant.setLikes(post.getLikes());
        existant.setImages(post.getImages() != null ? new ArrayList<>(post.getImages()) : new ArrayList<>());

        Post saved = postRepository.save(existant);

        List<String> imageUrls = saved.getImages() != null ? saved.getImages() : List.of();
        harmfulContentService.analyseAsync(saved.getId(), saved.getContenu(), imageUrls);

        return saved;
    }

    @Override
    @Transactional
    public void supprimer(String email, Long id) {
        User user = getUserByEmail(email);
        Post post = postRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Post non trouvé ou accès refusé"));
        post.getCommentaires().clear();
        post.getReactions().clear();
        post.getImages().clear();
        postRepository.save(post);
        postRepository.deleteById(id);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }
}