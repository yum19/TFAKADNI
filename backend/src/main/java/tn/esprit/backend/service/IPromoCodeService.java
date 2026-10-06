package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;

import java.util.List;

public interface IPromoCodeService {
    PromoCodeResponse         validate(String code);
    PromoCodeResponse         create(PromoCodeRequest request);
    PromoCodeResponse         update(Long id, PromoCodeRequest request);
    List<PromoCodeResponse>   findAll();
    PromoCodeResponse         toggleActive(Long id);
    void                      delete(Long id);
}