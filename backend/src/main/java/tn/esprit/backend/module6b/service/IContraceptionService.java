package tn.esprit.backend.module6b.service;

import tn.esprit.backend.module6b.dto.*;

import java.util.List;

public interface IContraceptionService {

    ContraceptionProfileResponseDto recommendMethod(String email, ContraceptionProfileRequestDto dto);

    List<ContraceptionProfileResponseDto> getProfilesByMother(String email);

    ContraceptionProfileResponseDto getProfileById(String email, Long id);

    void deleteRecommendation(String email, Long id);

    ContraceptionChatMessageResponseDto sendChatMessage(String email, ContraceptionChatRequestDto dto);

    List<ContraceptionChatMessageResponseDto> getChatHistory(String email);

    List<ContraceptionChatMessageResponseDto> getChatSession(String email, String sessionId);
    ContraceptionChatMessageResponseDto updateChatMessage(String email, Long id, ContraceptionChatRequestDto dto);
    void deleteChatMessage(String email, Long id);

    ContraceptionLogResponseDto createLog(String email, ContraceptionLogRequestDto dto);

    ContraceptionLogResponseDto getActiveLog(String email);

    ContraceptionLogResponseDto stopLog(String email, Long id);

    List<ContraceptionLogResponseDto> getLogsByMother(String email);

    List<ContraceptionLogResponseDto> getLogsByMotherAndStatus(String email, String status);

    ContraceptionLogResponseDto getLogById(String email, Long id);

    ContraceptionLogResponseDto updateLog(String email, Long id, ContraceptionLogRequestDto dto);

    void deleteLog(String email, Long id);
}