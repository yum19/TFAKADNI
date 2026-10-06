package tn.esprit.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.backend.entity.PrenatalExam;
import tn.esprit.backend.entity.Pregnancy;
import tn.esprit.backend.repository.PrenatalExamRepository;
import tn.esprit.backend.repository.PregnancyRepository;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrenatalExamService {

    private final PrenatalExamRepository prenatalExamRepository;
    private final PregnancyRepository pregnancyRepository; // ← direct repo, pas le service

    public List<PrenatalExam> getByPregnancy(Long pregnancyId) {
        return prenatalExamRepository.findByPregnancyId(pregnancyId);
    }

    public List<PrenatalExam> getPending(Long pregnancyId) {
        return prenatalExamRepository.findByPregnancyIdAndDone(pregnancyId, false);
    }

    public PrenatalExam create(Long pregnancyId, PrenatalExam exam) {
        Pregnancy pregnancy = pregnancyRepository.findById(pregnancyId)
                .orElseThrow(() -> new RuntimeException("Grossesse non trouvée"));
        exam.setPregnancy(pregnancy);
        return prenatalExamRepository.save(exam);
    }

    public PrenatalExam markAsDone(Long examId, PrenatalExam updated) {
        PrenatalExam exam = prenatalExamRepository
                .findById(examId)
                .orElseThrow(() -> new RuntimeException("Examen non trouvé"));
        exam.setDone(true);
        exam.setDoneDate(updated.getDoneDate());
        exam.setResultNotes(updated.getResultNotes());
        exam.setDocumentUrl(updated.getDocumentUrl());
        return prenatalExamRepository.save(exam);
    }

    public PrenatalExam update(Long examId, PrenatalExam updated) {
        PrenatalExam exam = prenatalExamRepository
                .findById(examId)
                .orElseThrow(() -> new RuntimeException("Examen non trouvé"));
        exam.setExamName(updated.getExamName());
        exam.setExamType(updated.getExamType());
        exam.setRecommendedWeek(updated.getRecommendedWeek());
        exam.setResultNotes(updated.getResultNotes());
        exam.setDocumentUrl(updated.getDocumentUrl());
        exam.setDoneDate(updated.getDoneDate());
        return prenatalExamRepository.save(exam);
    }

    public void delete(Long examId) {
        PrenatalExam exam = prenatalExamRepository
                .findById(examId)
                .orElseThrow(() -> new RuntimeException("Examen non trouvé"));
        if (exam.getExamType() != PrenatalExam.ExamType.CUSTOM) {
            throw new RuntimeException("Impossible de supprimer un examen obligatoire");
        }
        prenatalExamRepository.deleteById(examId);
    }

    public List<PrenatalExam> getAllExams() {
        return prenatalExamRepository.findAll();
    }

    // ═══════════════════════════════════════════════════════
    //   GÉNÉRATION AUTOMATIQUE DES EXAMENS STANDARDS
    // ═══════════════════════════════════════════════════════

    public void generateStandardExams(Pregnancy pregnancy) {
        List<PrenatalExam> exams = new ArrayList<>();

        // ── COMMUNS À TOUS (11 examens) ────────────────────────
        exams.add(build("Blood group & Rhesus",         PrenatalExam.ExamType.MANDATORY, 8,  pregnancy));
        exams.add(build("HIV / Syphilis / Hepatitis B", PrenatalExam.ExamType.MANDATORY, 8,  pregnancy));
        exams.add(build("Complete blood count (CBC)",   PrenatalExam.ExamType.MANDATORY, 10, pregnancy));
        exams.add(build("Nuchal translucency scan",     PrenatalExam.ExamType.MANDATORY, 12, pregnancy));
        exams.add(build("1st Trimester ultrasound",     PrenatalExam.ExamType.MANDATORY, 12, pregnancy));
        exams.add(build("Morphology ultrasound",        PrenatalExam.ExamType.MANDATORY, 22, pregnancy));
        exams.add(build("Gestational diabetes (OGTT)",  PrenatalExam.ExamType.MANDATORY, 24, pregnancy));
        exams.add(build("Anemia blood test",            PrenatalExam.ExamType.MANDATORY, 28, pregnancy));
        exams.add(build("3rd Trimester ultrasound",     PrenatalExam.ExamType.MANDATORY, 32, pregnancy));
        exams.add(build("Group B Strep test",           PrenatalExam.ExamType.MANDATORY, 36, pregnancy));
        exams.add(build("Pre-birth checkup",            PrenatalExam.ExamType.MANDATORY, 38, pregnancy));

        // ── EXTRAS TWINS → +4 = 15 total ──────────────────────
        if (pregnancy.getPregnancyType() == Pregnancy.PregnancyType.TWINS ||
                pregnancy.getPregnancyType() == Pregnancy.PregnancyType.TRIPLETS) {
            exams.add(build("Twin growth monitoring",      PrenatalExam.ExamType.MANDATORY, 16, pregnancy));
            exams.add(build("Cervical length measurement", PrenatalExam.ExamType.MANDATORY, 20, pregnancy));
            exams.add(build("Twin ultrasound follow-up",   PrenatalExam.ExamType.MANDATORY, 28, pregnancy));
            exams.add(build("Twin ultrasound follow-up",   PrenatalExam.ExamType.MANDATORY, 34, pregnancy));
        }

        // ── EXTRAS TRIPLETS → +8 = 19 total ───────────────────
        if (pregnancy.getPregnancyType() == Pregnancy.PregnancyType.TRIPLETS) {
            exams.add(build("Triplet growth monitoring",        PrenatalExam.ExamType.MANDATORY, 14, pregnancy));
            exams.add(build("Cervical length measurement (T3)", PrenatalExam.ExamType.MANDATORY, 16, pregnancy));
            exams.add(build("Triplet ultrasound follow-up",     PrenatalExam.ExamType.MANDATORY, 20, pregnancy));
            exams.add(build("Triplet ultrasound follow-up",     PrenatalExam.ExamType.MANDATORY, 24, pregnancy));
            exams.add(build("Triplet ultrasound follow-up",     PrenatalExam.ExamType.MANDATORY, 28, pregnancy));
            exams.add(build("Triplet ultrasound follow-up",     PrenatalExam.ExamType.MANDATORY, 30, pregnancy));
            exams.add(build("Triplet ultrasound follow-up",     PrenatalExam.ExamType.MANDATORY, 32, pregnancy));
            exams.add(build("Pre-birth intensive checkup",      PrenatalExam.ExamType.MANDATORY, 34, pregnancy));
        }

        prenatalExamRepository.saveAll(exams);
    }

    private PrenatalExam build(String name, PrenatalExam.ExamType type,
                               int week, Pregnancy pregnancy) {
        PrenatalExam exam = new PrenatalExam();
        exam.setExamName(name);
        exam.setExamType(type);
        exam.setRecommendedWeek(week);
        exam.setDone(false);
        exam.setPregnancy(pregnancy);
        return exam;
    }
}