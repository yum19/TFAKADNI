package tn.esprit.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import tn.esprit.backend.entity.User;
import tn.esprit.backend.repository.UserRepository;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.upload.dir:uploads/avatars}")
    private String uploadDir;

    private static final String LOCAL_AVATAR_PREFIX = "http://localhost:8081/api/users/me/avatar/";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email      = oAuth2User.getAttribute("email");
        String firstName  = oAuth2User.getAttribute("given_name");
        String lastName   = oAuth2User.getAttribute("family_name");
        String picture    = oAuth2User.getAttribute("picture");

        // Créer ou retrouver l'utilisateur
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .firstName(firstName != null ? firstName : "")
                    .lastName(lastName != null ? lastName : "")
                    .provider(User.Provider.GOOGLE)
                    .role(User.Role.USER)
                    .isActive(true)
                    .avatarUrl(picture)
                    .build();
            userRepository.save(newUser);
            log.info("Nouveau compte Google créé : {}", email);
            return newUser;
        });

        // ✅ FIX : ne remplacer l'avatar que si l'utilisateur n'a PAS d'avatar local uploadé.
        // Si avatarUrl pointe vers localhost → l'utilisateur a uploadé une photo perso → on la garde.
        // Si avatarUrl est null ou une URL Google → on met à jour avec la photo Google actuelle.
        boolean hasLocalAvatar = user.getAvatarUrl() != null
                && user.getAvatarUrl().startsWith(LOCAL_AVATAR_PREFIX);

        if (!hasLocalAvatar && picture != null && !picture.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(picture);
            userRepository.save(user);
            log.info("Avatar Google mis à jour pour : {}", email);
        }

        // Générer les tokens JWT
        String accessToken  = jwtService.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Rediriger vers le frontend avec les tokens
        String redirectUrl = String.format(
                "http://localhost:4200/auth/oauth2/callback?accessToken=%s&refreshToken=%s",
                accessToken, refreshToken
        );

        log.info("OAuth2 Google login réussi : {}", email);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    /**
     * Vérifie si une URL d'avatar pointe vers un fichier local uploadé.
     */
    private boolean isLocalAvatar(String avatarUrl) {
        return avatarUrl != null && avatarUrl.startsWith(LOCAL_AVATAR_PREFIX);
    }
}